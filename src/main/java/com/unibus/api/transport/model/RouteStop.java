package com.unibus.api.transport.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Generated;

@Entity
@Table(
   name = "route_stops"
)
public class RouteStop {
   @Id
   @GeneratedValue(
      strategy = GenerationType.IDENTITY
   )
   @Column(
      name = "route_stop_id"
   )
   private Integer id;
   @ManyToOne(
      fetch = FetchType.LAZY,
      optional = false
   )
   @JoinColumn(
      name = "route_id",
      nullable = false
   )
   private BusRoute route;
   @ManyToOne(
      fetch = FetchType.LAZY,
      optional = false
   )
   @JoinColumn(
      name = "stop_id",
      nullable = false
   )
   private Stop stop;
   @Column(
      name = "stop_order",
      nullable = false
   )
   private Integer stopOrder;
   @Column(
      name = "minutes_from_previous_stop"
   )
   private Integer minutesFromPreviousStop;

   @Generated
   public Integer getId() {
      return this.id;
   }

   @Generated
   public BusRoute getRoute() {
      return this.route;
   }

   @Generated
   public Stop getStop() {
      return this.stop;
   }

   @Generated
   public Integer getStopOrder() {
      return this.stopOrder;
   }

   @Generated
   public Integer getMinutesFromPreviousStop() {
      return this.minutesFromPreviousStop;
   }

   @Generated
   public void setId(final Integer id) {
      this.id = id;
   }

   @Generated
   public void setRoute(final BusRoute route) {
      this.route = route;
   }

   @Generated
   public void setStop(final Stop stop) {
      this.stop = stop;
   }

   @Generated
   public void setStopOrder(final Integer stopOrder) {
      this.stopOrder = stopOrder;
   }

   @Generated
   public void setMinutesFromPreviousStop(final Integer minutesFromPreviousStop) {
      this.minutesFromPreviousStop = minutesFromPreviousStop;
   }
}
