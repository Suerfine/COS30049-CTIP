import React from 'react';

import Payment from '../components/ProcessPayment';
import { usePaymentProcess } from '../hooks/usePaymentProcess';

const PaymentScreen = ({ navigation, route }) => {
    const { course } = route.params;

    const {
        receipt,
        submitting,
        amount,
        onUploadReceipt,
        onRemoveReceipt,
        onConfirmPayment
    } = usePaymentProcess(course, navigation);

    return (
        <Payment
            navigation={navigation}
            course={course}
            amount={amount}
            receipt={receipt}
            submitting={submitting}
            onUploadReceipt={onUploadReceipt}
            onRemoveReceipt={onRemoveReceipt}
            onConfirmPayment={onConfirmPayment}
        />
    );
};

export default PaymentScreen;