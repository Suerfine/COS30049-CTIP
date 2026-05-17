import {useState, useCallback, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

const LANGUAGE_KEY = 'appLanguage';

export const useSetLanguage=()=>{
    const [language, setLanguage]=useState('English');
    const [langModalVisible, setLangModalVisible]=useState(false);
    const {i18n, t}=useTranslation();

    useEffect(() => {
        const loadLanguage = async () => {
            try {
                const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
                if (saved) {
                    setLanguage(saved);
                    const langCode = saved === 'Bahasa Melayu' ? 'bm' : 'en';
                    i18n.changeLanguage(langCode);
                }
            } catch (err) {
                console.error('[useSetLanguage] Failed to load language:', err);
            }
        };
        loadLanguage();
    }, []);

    const openLanguageModal  = () => setLangModalVisible(true);
    const closeLanguageModal = () => setLangModalVisible(false);

    const selectLanguage = async (langVal) => {
        try {
            setLanguage(langVal);
            const langCode = langVal === 'Bahasa Melayu' ? 'bm' : 'en';
            i18n.changeLanguage(langCode);

            await AsyncStorage.setItem(LANGUAGE_KEY, langVal);
        } catch (err) {
            console.error('[useSetLanguage] Failed to save language:', err);
        }
        closeLanguageModal();
    };

    const getLanguageDisplay = () => language;

    return {
        language,
        langModalVisible,
        openLanguageModal,
        closeLanguageModal,
        selectLanguage,
        getLanguageDisplay,
    };
};