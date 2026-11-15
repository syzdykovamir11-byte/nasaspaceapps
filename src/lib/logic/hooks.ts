import { useQueries, useQuery } from "@tanstack/react-query";
import { fetchJson, getAgroMonitoringData } from ".";
import { useLandStore } from "../store/land-store";
import { useViewStore } from "../store/view-store";

export function useLandMonitoring() {
  const { selectedLand } = useLandStore();
  const { currentDate } = useViewStore();

  const { data } = useQuery({
    queryKey: ["satelite", selectedLand?.name],
    queryFn: () =>
      getAgroMonitoringData(selectedLand!.polygonId, currentDate.toISOString()),

    enabled: !!selectedLand,
    staleTime: Infinity,
  });

  return data;
}

export function useStats() {
  const data = useLandMonitoring();

  const queries = useQueries({
    queries: Object.entries(data?.stats ?? []).map(([key, data]) => {
      return {
        queryKey: ["stat", key],
        queryFn: async () => {
          const metrics = await fetchJson(data);
          return { key, ...metrics };
        },
      };
    }),
  });

  const success = queries.every((num) => num.isSuccess === true);

  return [queries, success];
}
