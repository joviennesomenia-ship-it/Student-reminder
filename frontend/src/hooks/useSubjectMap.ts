import { useMemo } from 'react';
import { useSubjects } from '@/api/hooks';
import type { Subject } from '@/types';

export function useSubjectMap(): { map: Map<string, Subject>; subjects: Subject[] } {
  const { data } = useSubjects();
  return useMemo(() => {
    const subjects = data ?? [];
    return { subjects, map: new Map(subjects.map((s) => [s.id, s])) };
  }, [data]);
}
