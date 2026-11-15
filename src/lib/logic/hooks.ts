import { useQueries, useQuery } from "@tanstack/react-query";
import { fetchJson, getAgroMonitoringData } from ".";
import { useLandStore } from "../store/land-store";
import { useViewStore } from "../store/view-store";

function useLandQuery() {
  const { selectedLand } = useLandStore();
  const { currentDate } = useViewStore();

  return useQuery({
    queryKey: ["satelite", selectedLand?.name, currentDate.toDateString()],
    queryFn: () =>
      getAgroMonitoringData(selectedLand!.polygonId, currentDate.toISOString()),

    enabled: !!selectedLand,
    staleTime: Infinity,
    retry: false,
  });
}

export function useLandMonitoring() {
  return useLandQuery().data;
}

export function useLandMonitoringStatus() {
  const { selectedLand } = useLandStore();
  const { isLoading, isError } = useLandQuery();
  return { hasField: !!selectedLand, isLoading, isError };
}

export function useStats() {
  const data = useLandMonitoring();

  const queries = useQueries({
    queries: Object.entries(data?.stats ?? []).map(([key, data]) => {
      return {
        queryKey: ["stat", key, data],
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
