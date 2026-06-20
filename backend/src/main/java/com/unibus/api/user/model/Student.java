package com.unibus.api.user.model;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "students")
@Getter
@Setter
@NoArgsConstructor
public class Student {

    @Id
    @Column(name = "student_code", length = 20)
    private String studentCode;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false, length = 150)
    private String university;

    @Column(name = "university_id")
    private Integer universityId;

    @Column(length = 100)
    private String faculty;

    @Column(name = "academic_year")
    private Integer academicYear;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;
}
