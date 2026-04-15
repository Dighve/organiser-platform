package com.organiser.platform.repository;

import com.organiser.platform.model.EventTransportLeg;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventTransportLegRepository extends JpaRepository<EventTransportLeg, Long> {

    List<EventTransportLeg> findByEventIdOrderBySortOrderAsc(Long eventId);

    void deleteByEventId(Long eventId);
}
