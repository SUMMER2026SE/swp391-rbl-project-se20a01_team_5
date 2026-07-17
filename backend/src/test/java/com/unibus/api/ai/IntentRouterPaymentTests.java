package com.unibus.api.ai;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;

class IntentRouterPaymentTests {
    @Test
    void buyingSingleTicketIsPaymentIntentEvenWhenRouteIsMentioned() {
        assertThat(new IntentRouter().detect("Tôi muốn mua vé lượt tuyến 02 thì cần làm gì?"))
                .isEqualTo(AiIntent.PAYMENT_LOOKUP);
    }

    @Test
    void naturalRouteQuestionIsNotMistakenForSmallTalk() {
        assertThat(new IntentRouter().detect("Tôi đang ở trường FPT, muốn qua Bách khoa thì đi sao?"))
                .isEqualTo(AiIntent.ROUTE_SUGGESTION);
    }

    @Test
    void shortPointToPointQuestionIsRouteIntent() {
        assertThat(new IntentRouter().detect("Từ FPT đến Duy Tân đi xe nào?"))
                .isEqualTo(AiIntent.ROUTE_SUGGESTION);
    }

    @Test
    void unsureFirstTimeUserGetsHelpIntent() {
        assertThat(new IntentRouter().detect("Tôi không biết bắt đầu từ đâu để đi xe buýt đến trường"))
                .isEqualTo(AiIntent.HELP);
    }

    @Test
    void fareQuestionWinsOverRouteKeyword() {
        assertThat(new IntentRouter().detect("Vé lượt và vé tháng tuyến 16 giá bao nhiêu, tôi được trợ giá không?"))
                .isEqualTo(AiIntent.FARE_LOOKUP);
    }

    @Test
    void scheduleQuestionWinsOverRouteKeyword() {
        assertThat(new IntentRouter().detect("Tuyến 16 chuyến tiếp theo lúc mấy giờ?"))
                .isEqualTo(AiIntent.SCHEDULE_LOOKUP);
    }

    @Test
    void ticketFollowUpIsFareInsteadOfSmallTalk() {
        assertThat(new IntentRouter().detect("Còn vé lượt thì sao?"))
                .isEqualTo(AiIntent.FARE_LOOKUP);
    }

    @Test
    void greetingRequiresAWholePhrase() {
        IntentRouter router = new IntentRouter();

        assertThat(router.isSmallTalk("hi")).isTrue();
        assertThat(router.isSmallTalk("Tuyến đó thì sao?")).isFalse();
    }
}
