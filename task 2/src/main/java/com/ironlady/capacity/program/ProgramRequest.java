package com.ironlady.capacity.program;

import java.time.LocalDate;

public record ProgramRequest(
    String programName,
    LocalDate startDate,
    LocalDate endDate,
    Integer maxParticipants,
    Integer currentEnrollments,
    Integer assignedMentors,
    String status
) {}
