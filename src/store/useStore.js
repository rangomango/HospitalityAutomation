import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SUPPLY_TYPES, SUPPLY_TYPE_MAP } from '../data/constants';

const uid = () => Math.random().toString(36).slice(2, 9);

const initialState = {
  events: [],
  // { id, name, type, date, startTime, bufferHours, rooms: [roomId,...] }

  supplyUnits: [],
  // { id, typeId, floor, location: 'closet'|roomId, status: 'available'|'in_transit'|'checked_out' }

  tasks: [],
  // { id, type:'forward_deploy'|'deliver'|'retrieve', label, supplyUnitIds, fromFloor, fromLocation, toFloor, toLocation, status:'pending'|'accepted'|'completed', staffId, requestId, deadline, createdAt }

  requests: [],
  // { id, guestRoom, floor, typeId, status:'pending'|'assigned'|'delivered'|'returned', taskId, requestedAt, deliveredAt, reminderSent }

  notifications: [],
  // { id, type:'task'|'request'|'conflict'|'reminder', message, read, createdAt }

  guestRoom: null,
  currentMapFloor: 1,
};

export const useStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      // ─── Events ───────────────────────────────────────────────────────────
      addEvent(data) {
        const event = { ...data, id: uid(), createdAt: Date.now() };
        set(s => ({ events: [...s.events, event] }));
        return event.id;
      },
      removeEvent(id) {
        set(s => ({ events: s.events.filter(e => e.id !== id) }));
      },
      updateEvent(id, data) {
        set(s => ({ events: s.events.map(e => e.id === id ? { ...e, ...data } : e) }));
      },

      // ─── Supply Inventory ─────────────────────────────────────────────────
      addSupplyUnits(typeId, quantity, floor) {
        const units = Array.from({ length: quantity }, () => ({
          id: uid(), typeId, floor, location: 'closet', status: 'available',
        }));
        set(s => ({ supplyUnits: [...s.supplyUnits, ...units] }));
      },
      removeSupplyUnits(typeId, quantity, floor) {
        set(s => {
          const removable = s.supplyUnits
            .filter(u => u.typeId === typeId && u.floor === floor && u.status === 'available')
            .slice(0, quantity)
            .map(u => u.id);
          return { supplyUnits: s.supplyUnits.filter(u => !removable.includes(u.id)) };
        });
      },
      _updateUnit(unitId, updates) {
        set(s => ({
          supplyUnits: s.supplyUnits.map(u => u.id === unitId ? { ...u, ...updates } : u),
        }));
      },

      // ─── Tasks ────────────────────────────────────────────────────────────
      _createTask(task) {
        const t = { ...task, id: uid(), status: 'pending', createdAt: Date.now() };
        set(s => ({ tasks: [...s.tasks, t] }));
        return t.id;
      },
      acceptTask(taskId) {
        const task = get().tasks.find(t => t.id === taskId);
        set(s => ({
          tasks: s.tasks.map(t => t.id === taskId ? { ...t, status: 'accepted' } : t),
          requests: task?.type === 'deliver' && task?.requestId
            ? s.requests.map(r => r.id === task.requestId ? { ...r, status: 'assigned' } : r)
            : s.requests,
        }));
      },
      completeTask(taskId) {
        const { tasks, supplyUnits, requests } = get();
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        // Move supply units to new location
        const updatedUnits = supplyUnits.map(u => {
          if (!task.supplyUnitIds.includes(u.id)) return u;
          const newStatus = task.toLocation === 'closet' ? 'available' : 'checked_out';
          return { ...u, floor: task.toFloor, location: task.toLocation, status: newStatus };
        });

        // Update linked request
        const updatedRequests = requests.map(r => {
          if (r.id !== task.requestId) return r;
          return {
            ...r,
            status: task.type === 'deliver' ? 'delivered' : task.type === 'retrieve' ? 'returned' : r.status,
            deliveredAt: task.type === 'deliver' ? Date.now() : r.deliveredAt,
          };
        });

        set(s => ({
          tasks: s.tasks.map(t => t.id === taskId ? { ...t, status: 'completed', completedAt: Date.now() } : t),
          supplyUnits: updatedUnits,
          requests: updatedRequests,
        }));
      },

      // Create forward-deploy tasks from deploy plan.
      // Re-reads supplyUnits each iteration so in_transit marks from prior iterations
      // don't cause the same unit to be assigned twice.
      createDeployTasks(plans) {
        let tasksCreated = 0;
        plans.forEach(plan => {
          if (plan.canFulfill <= 0) {
            if (plan.shortage > 0) {
              get()._notify({
                type: 'conflict',
                message: `Potential shortage on Floor ${plan.toFloor} for ${plan.eventName} — no ${plan.typeName}s available to move. Consider sourcing ${plan.shortage} more.`,
              });
            }
            return;
          }
          // Fresh read each iteration — previous _updateUnit calls may have changed statuses
          const freshUnits = get().supplyUnits
            .filter(u => u.typeId === plan.typeId && u.status === 'available' && u.floor !== plan.toFloor)
            .slice(0, plan.canFulfill);
          if (!freshUnits.length) return;

          get()._createTask({
            type: 'forward_deploy',
            label: `Move ${freshUnits.length} ${plan.typeName}${freshUnits.length !== 1 ? 's' : ''} to Floor ${plan.toFloor} in preparation for ${plan.eventName}`,
            supplyUnitIds: freshUnits.map(u => u.id),
            fromFloor: freshUnits[0].floor,
            fromLocation: 'closet',
            toFloor: plan.toFloor,
            toLocation: 'closet',
            deadline: plan.deadline,
            requestId: null,
          });

          // Move floor immediately so source floor count drops when task is created,
          // not only when completed. Destination shows them as 'in_transit' (incoming).
          freshUnits.forEach(u => get()._updateUnit(u.id, { status: 'in_transit', floor: plan.toFloor }));
          tasksCreated++;

          if (plan.shortage > 0) {
            get()._notify({
              type: 'conflict',
              message: `Potential shortage: Moving ${freshUnits.length} of ${plan.toSend} ${plan.typeName}${plan.toSend !== 1 ? 's' : ''} to Floor ${plan.toFloor} for ${plan.eventName} — ${plan.shortage} more may be needed.`,
            });
          }
        });
        return tasksCreated;
      },

      // Trigger deploy for a single event (test shortcut).
      // Returns count of tasks actually created (0 = nothing to do or no inventory).
      triggerEventDeploy(eventId) {
        const plan = get().getDeployPlan().filter(p => p.eventId === eventId);
        const actionable = plan.filter(p => p.canFulfill > 0);

        if (!actionable.length) {
          if (plan.length) {
            get()._notify({
              type: 'conflict',
              message: `No inventory available to move for this event. Add supplies to a storage floor first.`,
            });
          }
          return 0;
        }

        return get().createDeployTasks(plan);
      },

      // ─── Guest Requests ───────────────────────────────────────────────────
      createRequest(guestRoom, floor, typeId) {
        const { supplyUnits } = get();
        const typeName = SUPPLY_TYPE_MAP[typeId]?.name;

        // Prefer a unit already on the guest's floor; fall back to any floor
        let unit = supplyUnits.find(
          u => u.typeId === typeId && u.floor === floor && u.location === 'closet' && u.status === 'available'
        );
        if (!unit) {
          unit = supplyUnits.find(
            u => u.typeId === typeId && u.location === 'closet' && u.status === 'available'
          );
        }

        const reqId = uid();
        const request = {
          id: reqId, guestRoom, floor, typeId,
          status: 'pending', taskId: null,
          requestedAt: Date.now(), deliveredAt: null, reminderSent: false,
        };

        const taskId = get()._createTask({
          type: 'deliver',
          label: unit
            ? `Room ${guestRoom} has requested a ${typeName}`
            : `Room ${guestRoom} has requested a ${typeName} — item needs to be sourced`,
          supplyUnitIds: unit ? [unit.id] : [],
          fromFloor: unit ? unit.floor : floor,
          fromLocation: 'closet',
          toFloor: floor,
          toLocation: String(guestRoom),
          requestId: reqId,
          deadline: null,
        });

        if (unit) get()._updateUnit(unit.id, { status: 'in_transit' });
        set(s => ({ requests: [...s.requests, { ...request, taskId }] }));
        return { reqId, taskId };
      },

      cancelRequest(requestId) {
        const { requests, tasks } = get();
        const req = requests.find(r => r.id === requestId);
        if (!req) return;

        const task = tasks.find(t => t.id === req.taskId);
        if (task?.supplyUnitIds?.length) {
          set(s => ({
            supplyUnits: s.supplyUnits.map(u =>
              task.supplyUnitIds.includes(u.id)
                ? { ...u, status: 'available', floor: task.fromFloor, location: 'closet' }
                : u
            ),
          }));
        }

        set(s => ({
          tasks: s.tasks.map(t =>
            t.id === req.taskId ? { ...t, status: 'cancelled' } : t
          ),
          requests: s.requests.filter(r => r.id !== requestId),
        }));
      },

      removeTask: (taskId) => set(s => ({ tasks: s.tasks.filter(t => t.id !== taskId) })),

      triggerReturnReminder(requestId) {
        const req = get().requests.find(r => r.id === requestId);
        if (!req) return;
        get()._notify({
          type: 'reminder',
          message: `Room ${req.guestRoom}: Please place your ${SUPPLY_TYPE_MAP[req.typeId]?.name} outside the door for pickup, or tap below to keep it another day.`,
        });
        set(s => ({
          requests: s.requests.map(r => r.id === requestId ? { ...r, reminderSent: true } : r),
        }));
      },

      // ─── Notifications ────────────────────────────────────────────────────
      _notify(notif) {
        set(s => ({
          notifications: [{ ...notif, id: uid(), read: false, createdAt: Date.now() }, ...s.notifications],
        }));
      },
      markRead(id) {
        set(s => ({
          notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n),
        }));
      },
      markAllRead() {
        set(s => ({ notifications: s.notifications.map(n => ({ ...n, read: true })) }));
      },
      clearNotification(id) {
        set(s => ({ notifications: s.notifications.filter(n => n.id !== id) }));
      },
      clearAllNotifications() {
        set({ notifications: [] });
      },

      // ─── Conflict Detection ───────────────────────────────────────────────
      _checkConflicts() {
        const { events, supplyUnits } = get();
        if (!events.length) return;

        SUPPLY_TYPES.forEach(type => {
          // 1 unit covers 3 rooms
          const totalNeeded = events.reduce((sum, e) => sum + Math.ceil((e.rooms?.length || 0) / 3), 0);
          const totalHave = supplyUnits.filter(u => u.typeId === type.id).length;
          if (totalNeeded > totalHave) {
            get()._notify({
              type: 'conflict',
              message: `Potential shortage: ${totalNeeded} ${type.name}${totalNeeded !== 1 ? 's' : ''} needed across all events, but only ${totalHave} in stock — ${totalNeeded - totalHave} more may be needed.`,
            });
          }
        });
      },

      // ─── Deploy Plan ──────────────────────────────────────────────────────
      getDeployPlan() {
        const { events, supplyUnits } = get();
        if (!events.length) return [];

        const plans = [];

        events.forEach(event => {
          const eventRooms = event.rooms || [];
          if (!eventRooms.length) return;

          const eventFloors = [...new Set(eventRooms.map(r => Math.floor(r / 100)))];
          const [h, m] = event.startTime.split(':').map(Number);
          const eventDate = new Date(`${event.date}T${event.startTime}:00`);
          const deployBy = new Date(eventDate.getTime() - (event.bufferHours || 3) * 60 * 60 * 1000);

          eventFloors.forEach(floor => {
            const floorRooms = eventRooms.filter(r => Math.floor(r / 100) === floor);

            SUPPLY_TYPES.forEach(type => {
              // 1 unit serves 3 rooms
              const needed = Math.ceil(floorRooms.length / 3);
              const alreadyOnFloor = supplyUnits.filter(
                u => u.typeId === type.id && u.floor === floor && u.status !== 'checked_out'
              ).length;
              const toSend = Math.max(0, needed - alreadyOnFloor);
              if (toSend === 0) return;

              const available = supplyUnits.filter(
                u => u.typeId === type.id && u.floor !== floor && u.status === 'available'
              ).length;

              plans.push({
                eventId: event.id,
                eventName: event.name,
                typeId: type.id,
                typeName: type.name,
                typeId: type.id,
                toFloor: floor,
                needed,
                alreadyOnFloor,
                toSend,
                canFulfill: Math.min(toSend, available),
                shortage: Math.max(0, toSend - available),
                deadline: deployBy,
              });
            });
          });
        });

        return plans;
      },

      // ─── UI State ─────────────────────────────────────────────────────────
      setGuestRoom: (room) => set({ guestRoom: room }),

      resetGuestRoom(roomId) {
        const { requests, tasks } = get();
        const roomRequests = requests.filter(r => r.guestRoom === roomId);
        const roomRequestIds = new Set(roomRequests.map(r => r.id));
        const roomTasks = tasks.filter(t => roomRequestIds.has(t.requestId));
        const affectedUnitIds = new Set(roomTasks.flatMap(t => t.supplyUnitIds || []));

        set(s => ({
          requests: s.requests.filter(r => r.guestRoom !== roomId),
          tasks: s.tasks.filter(t => !roomRequestIds.has(t.requestId)),
          supplyUnits: s.supplyUnits.map(u =>
            affectedUnitIds.has(u.id)
              ? { ...u, status: 'available', location: 'closet' }
              : u
          ),
        }));
      },
      setMapFloor: (floor) => set({ currentMapFloor: floor }),

      clearTasks: () => set({ tasks: [] }),
      clearCompletedTasks: () => set(s => ({ tasks: s.tasks.filter(t => t.status !== 'completed') })),
      clearInventory: () => set({ supplyUnits: [] }),
      resetAll: () => set(initialState),
    }),
    { name: 'hotel-supply-v1' }
  )
);

// Derived selectors
export const selectors = {
  unreadCount: (s) => s.notifications.filter(n => !n.read && n.type === 'conflict').length,
  pendingTasks: (s) => s.tasks.filter(t => t.status === 'pending' || t.status === 'accepted'),
  activeTasks: (s) => s.tasks.filter(t => t.status !== 'completed'),
  unitsByFloor: (s, floor) => s.supplyUnits.filter(u => u.floor === floor),
  unitsInCloset: (s, floor) => s.supplyUnits.filter(u => u.floor === floor && u.location === 'closet' && u.status === 'available'),
  availableOnFloor: (s, floor) => {
    const inCloset = s.supplyUnits.filter(u => u.floor === floor && u.location === 'closet' && u.status === 'available');
    const byType = {};
    inCloset.forEach(u => { byType[u.typeId] = (byType[u.typeId] || 0) + 1; });
    return byType;
  },
};
