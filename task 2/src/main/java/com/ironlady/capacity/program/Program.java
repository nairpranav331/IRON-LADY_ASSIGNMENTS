package com.ironlady.capacity.program;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;

@Entity
@Table(name = "programs")
public class Program {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "program_name", nullable = false)
  private String programName;

  @Column(name = "start_date")
  private LocalDate startDate;

  @Column(name = "end_date")
  private LocalDate endDate;

  @Column(name = "max_participants", nullable = false)
  private int maxParticipants;

  @Column(name = "current_enrollments", nullable = false)
  private int currentEnrollments;

  @Column(name = "assigned_mentors", nullable = false)
  private int assignedMentors;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false)
  private ProgramStatus status;

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getProgramName() {
    return programName;
  }

  public void setProgramName(String programName) {
    this.programName = programName;
  }

  public LocalDate getStartDate() {
    return startDate;
  }

  public void setStartDate(LocalDate startDate) {
    this.startDate = startDate;
  }

  public LocalDate getEndDate() {
    return endDate;
  }

  public void setEndDate(LocalDate endDate) {
    this.endDate = endDate;
  }

  public int getMaxParticipants() {
    return maxParticipants;
  }

  public void setMaxParticipants(int maxParticipants) {
    this.maxParticipants = maxParticipants;
  }

  public int getCurrentEnrollments() {
    return currentEnrollments;
  }

  public void setCurrentEnrollments(int currentEnrollments) {
    this.currentEnrollments = currentEnrollments;
  }

  public int getAssignedMentors() {
    return assignedMentors;
  }

  public void setAssignedMentors(int assignedMentors) {
    this.assignedMentors = assignedMentors;
  }

  public ProgramStatus getStatus() {
    return status;
  }

  public void setStatus(ProgramStatus status) {
    this.status = status;
  }
}
