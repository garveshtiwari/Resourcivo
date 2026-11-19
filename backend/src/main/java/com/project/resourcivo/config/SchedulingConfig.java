package com.project.resourcivo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/** Turns on @Scheduled jobs (see NotificationScheduler). */
@Configuration
@EnableScheduling
public class SchedulingConfig {
}
