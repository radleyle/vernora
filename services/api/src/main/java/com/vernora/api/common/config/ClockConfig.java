package com.vernora.api.common.config;

import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Time as an injectable dependency. Services that need "now" take a Clock
 * instead of calling Instant.now(), so tests can pin time to a fixed instant
 * (Clock.fixed) and assert on scheduling behavior deterministically.
 */
@Configuration
public class ClockConfig {

    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }
}
