package com.ironlady.capacity.program;

import org.springframework.stereotype.Component;

@Component
public class ReadinessCalculator {
  public ReadinessResult calculate(int currentEnrollments, int maxParticipants, int assignedMentors) {
    double enrollmentPct = maxParticipants > 0
        ? ((double) currentEnrollments / (double) maxParticipants) * 100.0
        : 0.0;

    double mentorLoad = assignedMentors > 0
        ? ((double) currentEnrollments / (double) assignedMentors)
        : Double.POSITIVE_INFINITY;

    ReadinessStatus status;
    if (enrollmentPct > 90.0 || mentorLoad > 15.0) {
      status = ReadinessStatus.OVERLOADED;
    } else if ((enrollmentPct >= 70.0 && enrollmentPct <= 90.0) || (mentorLoad > 10.0 && mentorLoad <= 15.0)) {
      status = ReadinessStatus.AT_RISK;
    } else {
      status = ReadinessStatus.READY;
    }

    return new ReadinessResult(round1(enrollmentPct), round2(mentorLoad), status);
  }

  private double round1(double value) {
    return Math.round(value * 10.0) / 10.0;
  }

  private double round2(double value) {
    if (!Double.isFinite(value)) {
      return value;
    }
    return Math.round(value * 100.0) / 100.0;
  }
}
