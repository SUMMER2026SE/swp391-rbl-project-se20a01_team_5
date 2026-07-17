package com.unibus.api.ai;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;

class IntentRouterPaymentTests {
    @Test
    void buyingSingleTicketIsPaymentIntentEvenWhenRouteIsMentioned() {
        assertThat(new IntentRouter().detect("Tôi muốn mua vé lượt tuyến 02 thì cần làm gì?"))
                .isEqualTo(AiIntent.PAYMENT_LOOKUP);
    }
}
