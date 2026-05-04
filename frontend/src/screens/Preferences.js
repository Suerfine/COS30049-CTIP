import React from "react";
import { View, Text, StyleSheet, Pressable} from "react-native";
import ModalLayout from '../components/ModalLayout';
import { ModalStyle } from '../components/ModalStyle';
import { ChevronRight, Bell, X, Check, Languages } from 'lucide-react-native';

import { useSetLanguage } from '../hooks/useSetLanguage';
import { useTranslation } from 'react-i18next';

const Preferences = () => {
  const {t, i18n}=useTranslation();
  const {
      language,
      langModalVisible,
      openLanguageModal,
      closeLanguageModal,
      selectLanguage,
      getLanguageDisplay,
    }=useSetLanguage();

    const handleLanguageSelect=(langVal)=>{
        selectLanguage(langVal);
        const langCode=langVal==='Bahasa Melayu' ? 'bm':'en';
        i18n.changeLanguage(langCode);
      };
  return (
      <View style={styles.container}>
              <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t('general')}</Text>
                  <View style={styles.listGroup}>
                      {/* Language */}
                      <Pressable style={styles.listItem}
                      onPress={openLanguageModal}
                      >
                          <View style={styles.listItemLoading}>
                              <View style={[styles.iconBox,{ backgroundColor: '#e8f5e9' }]}>
                                  <Languages size={20} color="#0a6340"/>
                              </View>
                              <Text style={styles.listItemText}>
                                  {t('language')}
                              </Text>
                          </View>
                          <View style={styles.row}>
                              <Text style={styles.selectionText}>{getLanguageDisplay()}</Text>
                              <ChevronRight size={18} color="#ccc"/>
                          </View>
                      </Pressable>

                      <View style={styles.divider}/>

                      {/* Notification */}
                      <Pressable style={styles.listItem}>
                          <View style={styles.listItemLoading}>
                              <View style={[styles.iconBox, {backgroundColor:'#fff3e0'}]}>
                                  <Bell size={20} color="#f57c00"/>
                              </View>
                              <Text style={styles.listItemText}>{t("notification")}</Text>
                          </View>
                          <ChevronRight size={18} color="#ccc"/>
                      </Pressable>
                  </View>
              </View>

              {/* Language Modal */}
              <Modal animationType="slide" transparent={true} visible={langModalVisible} onRequestClose={closeLanguageModal}>
                  <View style={styles.fullModalOverlay}>
                      <View style={styles.fullModalContent}>
                          {/* Header */}
                          <View style={styles.modalHeader}>
                              <Pressable onPress={closeLanguageModal} style={({pressed})=>[styles.backButton, pressed && styles.btnPressed]}>
                                  <X size={24}/>
                              </Pressable>
                              <Pressable onPress={closeLanguageModal} style={styles.modalTitle}>
                                  <Text style={styles.modalTitle}>{t('language')}</Text>
                              </Pressable>
                          </View>
                          {[
                              { label: 'English', sub: 'BI', val: 'English' },
                              { label: 'Bahasa Melayu', sub: 'BM', val: 'Bahasa Melayu' }
                          ].map((item) => (
                              <Pressable 
                                  key={item.val} 
                                  style={styles.langItem} 
                                  onPress={() => handleLanguageSelect(item.val)}
                              >
                                  <View>
                                      <Text style={styles.langLabel}>{item.label}</Text>
                                      <Text style={styles.langSub}>{item.sub}</Text>
                                  </View>
                                  {language === item.val && <Check size={20} color="#0a6340" />}
                              </Pressable>
                          ))}
                      </View>
                  </View>
              </Modal>
      </View>
    );
};

export default Preferences;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});