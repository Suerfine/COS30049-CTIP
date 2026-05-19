import React, { useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    Image, 
    Alert,
    Platform 
} from 'react-native';
import { 
    Copy, 
    Upload, 
    CheckCircle2, 
    CreditCard, 
    Clock,
    Info 
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

const Payment = ({ 
    navigation, 
    course,
    amount,
    receipt,
    submitting,
    onUploadReceipt,
    onRemoveReceipt,
    onConfirmPayment
 }) => {
    const { t } = useTranslation();
    const courseTitle = course?.title;
    const refNumber = "SFC-7742-XP";

    const copyToClipboard = (text) => {
        if (Platform.OS === 'web') {
            navigator.clipboard.writeText(text);
            alert(`${text} copied to clipboard!`);
        }
    };

    return (
        <ScrollView style={styles.container}>

            <View style={styles.stepperContainer}>
                <View style={styles.step}>
                    <View style={[styles.stepCircle, styles.activeStep]}>
                        <CreditCard size={16} color="white" />
                    </View>
                    <Text style={styles.stepLabel}>{t('payment')}</Text>
                </View>
                <View style={styles.stepLine} />
                <View style={styles.step}>
                    <View style={styles.stepCircle}>
                        <Clock size={16} color="#999" />
                    </View>
                    <Text style={styles.stepLabel}>{t('review')}</Text>
                </View>
            </View>

            <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>{t('total_amount_due')}</Text>
                <Text style={styles.amountText}>{amount}</Text>
                <Text style={styles.courseName}>{courseTitle}</Text>
            </View>

            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Info size={18} color="#0a6340" />
                    <Text style={styles.sectionTitle}>{t('step_1_transfer_funds')}</Text>
                </View>
                <Text style={styles.instruction}>{t('transfer_instruction')}</Text>
                
                <View style={styles.bankCard}>
                    <View style={styles.bankRow}>
                        <View>
                            <Text style={styles.bankLabel}>{t('bank_name')}</Text>
                            <Text style={styles.bankValue}>SFC Bank Malaysia</Text>
                        </View>
                    </View>
                    <View style={styles.bankRow}>
                        <View>
                            <Text style={styles.bankLabel}>{t('account_number')}</Text>
                            <Text style={styles.bankValue}>1234-5678-9012</Text>
                        </View>
                        <TouchableOpacity onPress={() => copyToClipboard('123456789012')}>
                            <Copy size={18} color="#0a6340" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.bankRow}>
                        <View>
                            <Text style={styles.bankLabel}>{t('bank_code')}</Text>
                            <Text style={styles.bankValue}>SFCMYKL</Text>
                        </View>
                        <TouchableOpacity onPress={() => copyToClipboard('SFCMYKL')}>
                            <Copy size={18} color="#0a6340" />
                        </TouchableOpacity>
                    </View>
                    <View style={[styles.bankRow, { borderBottomWidth: 0 }]}>
                        <View>
                            <Text style={styles.bankLabel}>{t('payment_reference')}</Text>
                            <Text style={styles.bankValue}>{refNumber}</Text>
                        </View>
                        <TouchableOpacity onPress={() => copyToClipboard(refNumber)}>
                            <Copy size={18} color="#0a6340" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('step_2_upload_receipt')}</Text>
                <Text style={styles.instruction}>{t('upload_receipt_instruction')}</Text>
                
                <TouchableOpacity 
                    style={styles.uploadBox} 
                    onPress={onUploadReceipt}
                >
                    {receipt ? (
                        <Image source={{ uri: receipt.uri }} style={styles.receiptPreview} />
                    ) : (
                        <View style={styles.uploadPlaceholder}>
                            <Upload color="#666" size={32} />
                            <Text style={styles.uploadText}>
                                {t('click_select_file')}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
                {receipt && (
                    <TouchableOpacity onPress={onRemoveReceipt}>
                        <Text style={styles.reselectText}>
                             {t('remove_file')}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            <TouchableOpacity 
                style={[styles.confirmBtn, (!receipt || submitting) && styles.btnDisabled]}
                onPress={onConfirmPayment}
                disabled={!receipt || submitting}
            >
                <Text style={styles.confirmBtnText}>
                    {submitting ? t('submitting') : t('confirm_payment')}
                </Text>
            </TouchableOpacity>

            <Text style={styles.footerNotice}>
                {t('payment_footer_notice')}
            </Text>
            <View style={{ height: 50 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#f8fafc' 
    },
    
    stepperContainer: { 
        flexDirection: 'row', 
        padding: 20, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    step: { 
        alignItems: 'center' 
    },
    stepCircle: { 
        width: 32, 
        height: 32, 
        borderRadius: 16, 
        backgroundColor: '#e2e8f0', 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    activeStep: { 
        backgroundColor: '#0a6340' 
    },
    stepLabel: { 
        fontSize: 10, 
        color: '#64748b', 
        marginTop: 4, 
        fontWeight: '600' 
    },
    stepLine: { 
        width: 40, 
        height: 2, 
        backgroundColor: '#e2e8f0', 
        marginHorizontal: 10, 
        marginTop: -15 
    },

    summaryCard: { 
        backgroundColor: '#0a6340', 
        margin: 20, 
        borderRadius: 16, 
        padding: 24, 
        alignItems: 'center' 
    },
    summaryLabel: { 
        color: 'rgba(255,255,255,0.8)', 
        fontSize: 13 
    },
    amountText: { 
        color: 'white', 
        fontSize: 32, 
        fontWeight: 'bold', 
        marginVertical: 8 
    },
    courseName: { 
        color: 'white', 
        fontSize: 14, 
        fontStyle: 'italic' 
    },

    section: { 
        padding: 20 
    },
    sectionHeader: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 8, 
        marginBottom: 12 
    },
    sectionTitle: { 
        fontSize: 16, 
        fontWeight: 'bold', 
        color: '#1a1a1a' 
    },
    instruction: { 
        fontSize: 14, 
        color: '#64748b', 
        marginBottom: 15, 
        lineHeight: 20 
    },

    bankCard: { 
        backgroundColor: 'white', 
        borderRadius: 12, 
        padding: 15, 
        borderWidth: 1, 
        borderColor: '#e2e8f0' 
    },
    bankRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingVertical: 12, 
        borderBottomWidth: 1, 
        borderBottomColor: '#f1f5f9' 
    },
    bankLabel: { 
        fontSize: 11, 
        color: '#94a3b8', 
        textTransform: 'uppercase', 
        letterSpacing: 0.5 
    },
    bankValue: { 
        fontSize: 15, 
        color: '#1e293b', 
        fontWeight: '600', 
        marginTop: 2 
    },

    uploadBox: { 
        height: 200, 
        backgroundColor: 'white', 
        borderRadius: 12, 
        borderWidth: 2, 
        borderColor: '#e2e8f0', 
        borderStyle: 'dashed', 
        overflow: 'hidden' 
    },
    uploadPlaceholder: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    uploadText: { 
        color: '#64748b', 
        marginTop: 10, 
        fontSize: 14 
    },
    receiptPreview: { 
        width: '100%', 
        height: '100%', 
        resizeMode: 'cover' 
    },
    reselectText: { 
        color: '#0a6340', 
        textAlign: 'center', 
        marginTop: 10, 
        fontWeight: '600' 
    },

    confirmBtn: { 
        backgroundColor: '#0a6340', 
        margin: 20, 
        padding: 18, 
        borderRadius: 12, 
        alignItems: 'center' 
    },
    btnDisabled: { 
        opacity: 0.5 
    },
    confirmBtnText: { 
        color: 'white', 
        fontWeight: 'bold', 
        fontSize: 16 
    },
    footerNotice: { 
        textAlign: 'center', 
        fontSize: 12, 
        color: '#94a3b8', 
        paddingHorizontal: 40, 
        lineHeight: 18 
    }
});

export default Payment;