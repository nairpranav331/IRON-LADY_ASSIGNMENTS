package com.ironlady.capacity.program;

import java.time.LocalDate;

public record ProgramResponse(
    Long id,
    String programName,
    LocalDate startDate,
    LocalDate endDate,
    int maxParticipants,
    int currentEnrollments,
    int assignedMentors,
    String status,
    double enrollmentPercentage,
    double mentorLoadRatio,
    String readinessStatus,
    String aiExplanation
) {}
