package com.unibus.api.user.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import lombok.Generated;

@Entity
@Table(
   name = "students"
)
public class Student {
   @Id
   @Column(
      name = "student_code",
      length = 20
   )
   private String studentCode;
   @OneToOne(
      fetch = FetchType.LAZY,
      optional = false
   )
   @JoinColumn(
      name = "user_id",
      nullable = false,
      unique = true
   )
   private User user;
   @Column(
      nullable = false,
      length = 150
   )
   private String university;
   @Column(
      length = 100
   )
   private String faculty;
   @Column(
      name = "academic_year"
   )
   private Integer academicYear;
   @Column(
      name = "date_of_birth"
   )
   private LocalDate dateOfBirth;

   @Generated
   public String getStudentCode() {
      return this.studentCode;
   }

   @Generated
   public User getUser() {
      return this.user;
   }

   @Generated
   public String getUniversity() {
      return this.university;
   }

   @Generated
   public String getFaculty() {
      return this.faculty;
   }

   @Generated
   public Integer getAcademicYear() {
      return this.academicYear;
   }

   @Generated
   public LocalDate getDateOfBirth() {
      return this.dateOfBirth;
   }

   @Generated
   public void setStudentCode(final String studentCode) {
      this.studentCode = studentCode;
   }

   @Generated
   public void setUser(final User user) {
      this.user = user;
   }

   @Generated
   public void setUniversity(final String university) {
      this.university = university;
   }

   @Generated
   public void setFaculty(final String faculty) {
      this.faculty = faculty;
   }

   @Generated
   public void setAcademicYear(final Integer academicYear) {
      this.academicYear = academicYear;
   }

   @Generated
   public void setDateOfBirth(final LocalDate dateOfBirth) {
      this.dateOfBirth = dateOfBirth;
   }
}
