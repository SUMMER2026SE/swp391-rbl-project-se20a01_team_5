package com.unibus.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class UnibusApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(UnibusApiApplication.class, args);
    }
}
