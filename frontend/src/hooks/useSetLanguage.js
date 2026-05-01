import {useState, useCallback} from 'react';

export const useSetLanguage=()=>{
    const [language, setLanguage]=useState('English');
    const [langModalVisible, setLangModalVisible]=useState(false);

    const openLanguageModal=useCallback(()=>{
        setLangModalVisible(true);
    },[]);

    const closeLanguageModal=useCallback(()=>{
        setLangModalVisible(false);
    },[]);

    const selectLanguage=useCallback((lang)=>{
        setLanguage(lang);
        setLangModalVisible(false);
    },[]);

    const getLanguageDisplay=()=>{
        return language==='English' ? 'English (BI)' : 'Bahasa Melayu (BM)';
    };

    return {
        language,
        langModalVisible,
        openLanguageModal,
        closeLanguageModal,
        selectLanguage,
        getLanguageDisplay,
    };
};