import { useState } from 'react';
import { View, Text, StyleSheet, Pressable} from "react-native";
import ModalLayout from '../components/ModalLayout';
import { ModalStyle } from '../components/ModalStyle';
import { ChevronRight, Bell, X, Check, Languages } from 'lucide-react-native';

import { useSetLanguage } from '../hooks/useSetLanguage';
import { useTranslation } from 'react-i18next';

import NotificationModal from "../components/NotificationModal";
import LanguageModal from "../components/LanguageModal";

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

    const [notifModalVisible, setNotifModalVisible] = useState(false);
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
                      <Pressable style={styles.listItem} onPress={() => setNotifModalVisible(true)}>
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

            {/* Render modal */}
            <LanguageModal
                visible={langModalVisible}
                onClose={closeLanguageModal}
                language={language}
                onSelect={handleLanguageSelect}
            />

            <NotificationModal visible={notifModalVisible} onClose={() => setNotifModalVisible(false)}/>
              
      </View>
    );
};

export default Preferences;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    section:{
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        elevation: 2,
        marginHorizontal:20,
        marginTop:15
    },
    sectionTitle:{
        marginBottom: 20,
        fontSize: 17,
        fontWeight: '600',
        color: 'black',
    },
    listGroup:{
        backgroundColor: 'white', 
        borderRadius: 16, 
        overflow: 'hidden'
    },
    listItem:{
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'space-between',
        padding:15
    },
    listItemLoading:{
        flexDirection:'row',
        alignItems:'center'
    },
    iconBox:{
        width: 36, 
        height: 36, 
        borderRadius: 10, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginRight: 12
    },
    listItemText:{
        fontSize:14,
        fontWeight:'500'
    },
    row:{
        flexDirection:"row"
    },
    selectionText:{
        color:'#8e8e93',
        marginRight:10,
        fontSize:14
    },
});