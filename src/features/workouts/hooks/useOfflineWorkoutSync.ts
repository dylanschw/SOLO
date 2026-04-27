import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../auth/hooks/useAuth'
import {
    getOfflineWorkoutSetsForSession,
    isBrowserOnline,
    loadOfflineWorkoutSets,
    removeOfflineWorkoutSet,
    updateOfflineWorkoutSetError
} from '../lib/offline-workout'
import { createWorkoutSet } from '../lib/workout-sessions'

export function useOfflineWorkoutSync(sessionId: string | null) {
    const { user } = useAuth()
    const queryClient = useQueryClient()
    const [isOnline, setIsOnline] = useState(isBrowserOnline())
    const [isSyncing, setIsSyncing] = useState(false)
    const [pendingCount, setPendingCount] = useState(() =>
        sessionId ? getOfflineWorkoutSetsForSession(sessionId).length : 0
    )

    function refreshPendingCount() {
        setPendingCount(sessionId ? getOfflineWorkoutSetsForSession(sessionId).length : 0)
    }

    async function syncPendingSets() {
        if (!user || !sessionId || !isBrowserOnline()) {
            refreshPendingCount()
            return
        }

        const pendingSets = loadOfflineWorkoutSets().filter(
            (set) => set.userId === user.id && set.workoutSessionId === sessionId
        )

        if (pendingSets.length === 0) {
            refreshPendingCount()
            return
        }

        setIsSyncing(true)

        for (const pendingSet of pendingSets) {
            try {
                await createWorkoutSet({
                    userId: pendingSet.userId,
                    workoutSessionId: pendingSet.workoutSessionId,
                    plannedExerciseId: pendingSet.plannedExerciseId,
                    exerciseId: pendingSet.exerciseId,
                    setNumber: pendingSet.setNumber,
                    setType: pendingSet.setType,
                    weight: pendingSet.weight,
                    weightUnit: pendingSet.weightUnit,
                    reps: pendingSet.reps,
                    rpe: pendingSet.rpe,
                    notes: pendingSet.notes,
                    clientId: pendingSet.localId
                })

                removeOfflineWorkoutSet(pendingSet.localId)
            } catch (error) {
                updateOfflineWorkoutSetError(
                    pendingSet.localId,
                    error instanceof Error ? error.message : 'Sync failed'
                )
            }
        }

        await queryClient.invalidateQueries({ queryKey: ['workout-sets', user.id, sessionId] })
        await queryClient.invalidateQueries({ queryKey: ['workout-sessions', user.id] })

        refreshPendingCount()
        setIsSyncing(false)
    }

    useEffect(() => {
        function handleOnline() {
            setIsOnline(true)
            syncPendingSets()
        }

        function handleOffline() {
            setIsOnline(false)
            refreshPendingCount()
        }

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        refreshPendingCount()

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [sessionId, user?.id])

    return {
        isOnline,
        isSyncing,
        pendingCount,
        refreshPendingCount,
        syncPendingSets
    }
}