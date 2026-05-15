import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Clock, CheckCircle2, ShieldAlert, FileText, CreditCard } from 'lucide-react-native';

const PaymentReview = ({ navigation, route }) => {
    const { courseTitle, amount } = route.params || {};

    const steps = [
        { title: "Payment Submitted", desc: "Receipt uploaded successfully", status: "complete" },
        { title: "Financial Verification", desc: "Admin checking bank code SFCMYKL", status: "current"  },
        { title: "Enrollment Review", desc: "Final administrative approval", status: "pending"  },
    ];

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.centerContent}>

            {/* ── Top stepper ── */}
            <View style={styles.stepperContainer}>
                <View style={styles.step}>
                    <View style={[styles.stepCircle, styles.stepCircleActive]}>
                        <CreditCard size={16} color="white" />
                    </View>
                    <Text style={styles.stepLabel}>Payment</Text>
                </View>

                <View style={styles.stepLine} />

                <View style={styles.step}>
                    <View style={[styles.stepCircle, styles.stepCircleActive]}>
                        <Clock size={16} color="white" />
                    </View>
                    <Text style={styles.stepLabel}>Review</Text>
                </View>
            </View>

            {/* ── Hero icon ── */}
            <View style={styles.iconContainer}>
                <Clock size={80} color="#0a6340" />
            </View>

            <Text style={styles.title}>Payment Under Review</Text>
            <Text style={styles.subtitle}>
                We've received your receipt for {courseTitle}. Your enrollment status is currently:{' '}
                <Text style={styles.statusBadge}>PENDING</Text>
            </Text>

            {/* ── Timeline ── */}
            <View style={styles.timeline}>
                {steps.map((step, index) => (
                    <View key={index} style={styles.timelineItem}>
                        <View style={styles.leftLineContainer}>
                            <View style={[
                                styles.dot,
                                step.status === 'complete' && styles.dotComplete,
                                step.status === 'current'  && styles.dotCurrent,
                            ]}>
                                {step.status === 'complete' && (
                                    <CheckCircle2 size={16} color="white" />
                                )}
                            </View>
                            {index < steps.length - 1 && (
                                <View style={styles.verticalLine} />
                            )}
                        </View>

                        <View style={styles.textContainer}>
                            <Text style={[
                                styles.stepTitle,
                                step.status === 'pending' && styles.textDisabled,
                            ]}>
                                {step.title}
                            </Text>
                            <Text style={styles.stepDesc}>{step.desc}</Text>
                        </View>
                    </View>
                ))}
            </View>

            {/* ── Warning box ── */}
            <View style={styles.infoBox}>
                <ShieldAlert size={20} color="#856404" />
                <Text style={styles.infoText}>
                    Please do not transfer funds again. If your receipt is rejected, you will be notified.
                </Text>
            </View>

            {/* ── Actions ── */}
            <TouchableOpacity
                style={styles.homeBtn}
                onPress={() => navigation.navigate('ParkGuideMobileRoot', {
                    screen: 'Courses'
                })}
            >
                <Text style={styles.homeBtnText}>Back to Courses</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.supportBtn}>
                <FileText size={16} color="#666" />
                <Text style={styles.supportText}>View Submitted Receipt</Text>
            </TouchableOpacity>

        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    centerContent: {
        alignItems: 'center',
        padding: 30,
    },

    /* ── Stepper ── */
    stepperContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
    },
    step: {
        alignItems: 'center',
    },
    stepCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#e2e8f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepCircleActive: {
        backgroundColor: '#0a6340',
    },
    stepLabel: {
        fontSize: 10,
        color: '#64748b',
        marginTop: 4,
        fontWeight: '600',
    },
    stepLine: {
        width: 40,
        height: 2,
        backgroundColor: '#0a6340', 
        marginHorizontal: 10,
        marginBottom: 14,
    },

    /* ── Hero ── */
    iconContainer: {
        marginTop: 40,
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 40,
    },
    statusBadge: {
        fontWeight: 'bold',
        color: '#0a6340',
    },

    /* ── Timeline ── */
    timeline: {
        alignSelf: 'stretch',
        marginLeft: 20,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 30,
    },
    leftLineContainer: {
        alignItems: 'center',
        marginRight: 15,
    },
    dot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#e2e8f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dotComplete: {
        backgroundColor: '#0a6340',
    },
    dotCurrent: {
        backgroundColor: '#FFD700',
        borderWidth: 2,
        borderColor: '#0a6340',
    },
    verticalLine: {
        width: 2,
        flex: 1,
        backgroundColor: '#e2e8f0',
        marginVertical: 5,
    },
    textContainer: {
        flex: 1,
        paddingTop: 2,
    },
    stepTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    textDisabled: {
        color: '#999',
    },
    stepDesc: {
        fontSize: 13,
        color: '#666',
        marginTop: 4,
    },

    /* ── Info box ── */
    infoBox: {
        backgroundColor: '#fff3cd',
        padding: 15,
        borderRadius: 10,
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
        marginTop: 20,
        alignSelf: 'stretch',
    },
    infoText: {
        flex: 1,
        fontSize: 12,
        color: '#856404',
        lineHeight: 18,
    },

    /* ── Buttons ── */
    homeBtn: {
        backgroundColor: '#0a6340',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 30,
        gap: 10,
        marginTop: 40,
    },
    homeBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    supportBtn: {
        marginTop: 25,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginBottom: 20,
    },
    supportText: {
        color: '#666',
        fontSize: 14,
        textDecorationLine: 'underline',
    },
});

export default PaymentReview;