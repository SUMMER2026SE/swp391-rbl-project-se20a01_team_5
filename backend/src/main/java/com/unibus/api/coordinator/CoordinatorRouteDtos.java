package com.unibus.api.coordinator;

public final class CoordinatorRouteDtos {

    private CoordinatorRouteDtos() {
    }

    public static record CoordinatorRouteItem(
            Integer id,
            String name,
            String description,
            Integer stopsCount,
            Boolean active) {
    }

    public static record CoordinatorRouteStopItem(
            Integer id,
            String name,
            String address,
            String timeFromStart,
            String type) {
    }
}
