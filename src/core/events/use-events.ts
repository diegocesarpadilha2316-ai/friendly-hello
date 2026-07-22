import { useQuery } from "@tanstack/react-query";
import { eventsListQuery, eventsMetricsQuery, eventDeliveriesQuery } from "./queries";

export const useEvents = () => useQuery(eventsListQuery());
export const useEventMetrics = () => useQuery(eventsMetricsQuery());
export const useEventDeliveries = () => useQuery(eventDeliveriesQuery());
