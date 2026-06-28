package com.unibus.api.admin;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.unibus.api.admin.AdminMonthlyPassDtos.MonthlyPassAdminView;
import com.unibus.api.common.ApiException;

@Service
public class AdminMonthlyPassService {

    private final AdminMonthlyPassRepository repository;

    public AdminMonthlyPassService(AdminMonthlyPassRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<MonthlyPassAdminView> list(String keyword, String status) {
        return repository.list(keyword, status);
    }

    @Transactional
    public MonthlyPassAdminView cancel(Integer monthlyPassId) {
        MonthlyPassAdminView current = repository.find(monthlyPassId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Monthly pass not found"));
        if (!"ACTIVE".equals(current.status())) {
            return current;
        }
        return repository.cancel(monthlyPassId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Monthly pass not found"));
    }
}
