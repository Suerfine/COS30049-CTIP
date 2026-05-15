import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Image, ActivityIndicator, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { X, Plus, Award, Tag } from 'lucide-react-native';

// Import other hook and components
import { ModalStyle as styles } from './ModalStyle';
import { isValidCourseTitle, isValidDuration, isValidExpiryWeeks, isValidBadgeExpiry } from '../utils/Validation';

const CourseFormContent = ({ onSubmit, onCancel, isLoading, initialData, allCourseList = [], allTagList = [] }) => {
    console.log(initialData);
    const getImageUri = (imageValue) => {
        if (!imageValue) return null;
        if (typeof imageValue === 'string') return imageValue;
        return imageValue.uri || null;
    };

    const getInitialTagsByType = (type) => {
        if (!initialData?.tags) return [];
        return initialData.tags
            .filter(t => t.type === type)
            .map(t => ({ id: t.id, title: t.title }));
    };

    const getInitialPrereqs = () => {
        if (!initialData?.prerequisite_groups?.[0]?.prerequisites) return [];

        return initialData.prerequisite_groups[0].prerequisites.map(p => {
            const matchedCourse = allCourseList.find(c => c.id === p.course_id);
            return {
                id: p.course_id,
                title: matchedCourse?.title || p.course_title || `Course #${p.course_id}`
            };
        });
    };

    const [form, setForm] = useState({
        courseTitle: initialData?.title || '',
        duration: initialData?.expected_completion_weeks?.toString() || '',
        cost: initialData?.cost || '',
        expiryWeeks: initialData?.must_complete_in_weeks?.toString() || '',
        badgeExpiry: initialData?.badge_expire_in_months?.toString() || '',
        image: initialData?.cover_img_url || null,
        badgeImage: initialData?.badge_img_url || null,
        status: initialData?.status || 'unreleased',
        locationTags: getInitialTagsByType('location'),
        categoryTags: getInitialTagsByType('category'),
        prerequisites: getInitialPrereqs(),
    });

    const [errors, setErrors] = useState({});
    const [showLocDropdown, setShowLocDropdown] = useState(false);
    const [showCatDropdown, setShowCatDropdown] = useState(false);
    const [showPrereqDropdown, setShowPrereqDropdown] = useState(false);

    const clearError = (field) => {
        setErrors(prev => {
            const updated = { ...prev };
            delete updated[field];
            return updated;
        });
    };

    const validateForm = () => {
        let tempErrors = {};
        if (!form.courseTitle.trim()) {
            tempErrors.courseTitle = "* Course title is required.";
        } else if (!isValidCourseTitle(form.courseTitle)) {
            tempErrors.courseTitle = "* Course title must be between 3-100 characters.";
        }

        if (!form.duration || form.duration.toString().trim() === "") {
            tempErrors.duration = "* Duration is required.";
        } else if (!isValidDuration(form.duration)) {
            tempErrors.duration = "* Duration must be between 1-52 weeks.";
        }

        if (!form.cost || form.cost.toString().trim() === "") {
            tempErrors.cost = "* Cost is required.";
        } else if (isNaN(form.cost) || parseFloat(form.cost) < 0) {
            tempErrors.cost = "* Cost must be a valid positive number.";
        }

        if (!form.expiryWeeks || form.expiryWeeks.toString().trim() === "") {
            tempErrors.expiryWeeks = "* Course validity is required.";
        } else if (!isValidExpiryWeeks(form.expiryWeeks)) {
            tempErrors.expiryWeeks = "* Course validity must be between 1-104 weeks.";
        }

        if (!form.badgeExpiry || form.badgeExpiry.toString().trim() === "") {
            tempErrors.badgeExpiry = "* Badge validity is required.";
        } else if (!isValidBadgeExpiry(form.badgeExpiry)) {
            tempErrors.badgeExpiry = "* Badge validity must be between 1-60 months.";
        }

        if (!form.badgeImage) {
            tempErrors.badgeImage = "* Completion badge image is required.";
        }

        if (form.locationTags.length > 0 && form.prerequisites.length === 0) {
            tempErrors.prerequisites = "* At least one pre-requisite is required when a location is specified.";
        }

        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const addTypedTag = (tag, key) => {
        if (!form[key].find(t => t.id === tag.id)) {
            setForm(prev => ({
                ...prev,
                [key]: [...prev[key], { id: tag.id, title: tag.title }]
            }));
        }
        key === 'locationTags' ? setShowLocDropdown(false) : setShowCatDropdown(false);
    };

    const removeTypedTag = (tagId, key) => {
        setForm(prev => ({
            ...prev,
            [key]: prev[key].filter(t => t.id !== tagId)
        }));
    };

    const handleNumericInput = (key, text) => {
        const cleaned = text.replace(/[^0-9]/g, '');
        setForm(prev => ({ ...prev, [key]: cleaned }));
    };

    const addPrerequisite = (course) => {
        if (!form.prerequisites.find(p => p.id === course.id)) {
            setForm(prev => ({
                ...prev,
                prerequisites: [...prev.prerequisites, { id: course.id, title: course.title }]
            }));
        }
        setShowPrereqDropdown(false);
    };

    const pickImage = async (type) => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            alert('Permission to access gallery is required!');
            return;
        }
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: type === 'badge' ? [1, 1] : [16, 9],
            quality: 1,
        });

        if (!result.canceled && result.assets?.[0]) {
            const pickedAsset = result.assets[0];

            if (type === 'badge') {
                setForm(prev => ({ ...prev, badgeImage: pickedAsset }));
                clearError('badgeImage');
            } else {
                setForm(prev => ({ ...prev, image: pickedAsset }));
            }
        }
    };

    const preparePayload = (statusOverride) => {
        return {
            ...form,
            status: statusOverride || form.status,
            duration: parseInt(form.duration, 10) || 0,
            cost: parseFloat(form.cost) || 0,
            expiryWeeks: parseInt(form.expiryWeeks, 10) || 0,
            badgeExpiry: parseInt(form.badgeExpiry, 10) || 0,
            prerequisite_course_ids: form.prerequisites.map(p => p.id),
            tags: [...form.locationTags, ...form.categoryTags].map(t => t.id),
        };
        
    };

    const handleSubmit = () => {
        if (!validateForm()) return;
        onSubmit(preparePayload());
    };

    const handlePublish = () => {
        if (!validateForm()) return;
        onSubmit(preparePayload('released'));
    };

    const handleUnpublish = () => {
        onSubmit(preparePayload('unreleased'));
    };

    return (
        <View style={{ flex: 1 }}>
            {/* Header - Fixed at Top */}
            <View style={[styles.header, styles.row, { paddingHorizontal: 20, paddingTop: 20 }]}>
                <Text style={styles.title}>{initialData ? 'Edit Course' : 'Create New Course'}</Text>
                <Pressable onPress={onCancel}>
                    <X color="#333" />
                </Pressable>
            </View>

            {/* Scrollable Body */}
            <ScrollView 
                contentContainerStyle={{ 
                    padding: 20, 
                    flexGrow: 1, 
                    justifyContent: 'flex-start' 
                }}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.row}>
                    <View style={styles.content, {flex: 2}}>
                        {/* Course Title */}
                        <View style={localStyles.inputGroup}>
                            <Text style={styles.label}>Title:</Text>
                            <TextInput 
                                style={styles.input} 
                                placeholder='Course Title' 
                                placeholderTextColor="#8f8f8f" 
                                value={form.courseTitle} 
                                onChangeText={(text) => {
                                    setForm({ ...form, courseTitle: text });
                                    clearError('courseTitle');
                                }} 
                            />
                            {errors.courseTitle && <Text style={localStyles.errorText}>{errors.courseTitle}</Text>}
                        </View>

                        {/* Completion Weeks & Cost */}
                        <View style={[styles.row, { gap: 15, marginBottom: 15 }]}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Course Completion (Weeks):</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder='e.g. 4'
                                    placeholderTextColor="#8f8f8f"
                                    keyboardType="numeric"
                                    value={form.duration}
                                    onChangeText={(text) => {
                                        handleNumericInput('duration', text);
                                        clearError('duration');
                                    }}
                                />
                                {errors.duration && <Text style={localStyles.errorText}>{errors.duration}</Text>}
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Cost (RM):</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder='0.00'
                                    placeholderTextColor="#8f8f8f"
                                    keyboardType="decimal-pad"
                                    value={form.cost}
                                    onChangeText={(text) => {
                                        const cleaned = text.replace(/[^0-9.]/g, '');
                                        setForm(prev => ({ ...prev, cost: cleaned }));
                                        clearError('cost');
                                    }}
                                />
                                {errors.cost && <Text style={localStyles.errorText}>{errors.cost}</Text>}
                            </View>
                        </View>

                        {/* Validity Settings */}
                        <View style={[styles.row, { gap: 15, marginBottom: 15 }]}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Course Validity (Weeks):</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder='e.g. 4'
                                    placeholderTextColor="#8f8f8f"
                                    keyboardType="numeric"
                                    value={form.expiryWeeks}
                                    onChangeText={(text) => {
                                        handleNumericInput('expiryWeeks', text);
                                        clearError('expiryWeeks');
                                    }}
                                />
                                {errors.expiryWeeks && <Text style={localStyles.errorText}>{errors.expiryWeeks}</Text>}
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Badge Validity (Months):</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder='e.g. 12'
                                    placeholderTextColor="#8f8f8f"
                                    keyboardType="numeric"
                                    value={form.badgeExpiry}
                                    onChangeText={(text) => {
                                        handleNumericInput('badgeExpiry', text);
                                        clearError('badgeExpiry');
                                    }}
                                />
                                {errors.badgeExpiry && <Text style={localStyles.errorText}>{errors.badgeExpiry}</Text>}
                            </View>
                        </View>

                        {/* Tags & Prerequisites */}
                        {/* Location Tags */}
                        <View style={localStyles.inputGroup}>
                            <Text style={styles.label}>Location Tags:</Text>
                            <View style={localStyles.multiSelectContainer}>
                                {form.locationTags.map(tag => (
                                    <View key={tag.id} style={localStyles.pill}>
                                        <Text style={localStyles.pillText}>{tag.title}</Text>
                                        <Pressable onPress={() => removeTypedTag(tag.id, 'locationTags')}>
                                            <X size={12} color="white" />
                                        </Pressable>
                                    </View>
                                ))}
                                <Pressable style={localStyles.addTagBtn} onPress={() => setShowLocDropdown(!showLocDropdown)}>
                                    <Plus size={16} color="#217837" />
                                    <Text style={localStyles.addTagText}>Add Location</Text>
                                </Pressable>
                            </View>
                            {showLocDropdown && (
                                <View style={localStyles.Tagdropdown}>
                                    <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 150 }}>
                                        {allTagList.filter(t => t.type === 'location').map(tag => (
                                            <Pressable key={tag.id} style={localStyles.TagdropdownItem} onPress={() => addTypedTag(tag, 'locationTags')}>
                                                <Tag size={14} color="#666" style={{ marginRight: 8 }} />
                                                <Text>{tag.title}</Text>
                                            </Pressable>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </View>

                        {/* Category Tags */}
                        <View style={localStyles.inputGroup}>
                            <Text style={styles.label}>Category Tags:</Text>
                            <View style={localStyles.multiSelectContainer}>
                                {form.categoryTags.map(tag => (
                                    <View key={tag.id} style={localStyles.pill}>
                                        <Text style={localStyles.pillText}>{tag.title}</Text>
                                        <Pressable onPress={() => removeTypedTag(tag.id, 'categoryTags')}>
                                            <X size={12} color="white" />
                                        </Pressable>
                                    </View>
                                ))}
                                <Pressable style={localStyles.addTagBtn} onPress={() => setShowCatDropdown(!showCatDropdown)}>
                                    <Plus size={16} color="#217837" />
                                    <Text style={localStyles.addTagText}>Add Category</Text>
                                </Pressable>
                            </View>
                            {showCatDropdown && (
                                <View style={localStyles.Tagdropdown}>
                                    <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 150 }}>
                                        {allTagList.filter(t => t.type === 'category').map(tag => (
                                            <Pressable key={tag.id} style={localStyles.TagdropdownItem} onPress={() => addTypedTag(tag, 'categoryTags')}>
                                                <Tag size={14} color="#666" style={{ marginRight: 8 }} />
                                                <Text>{tag.title}</Text>
                                            </Pressable>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </View>

                        {/* Pre-requisites */}
                        <View style={localStyles.inputGroup}>
                            <Text style={styles.label}>Pre-requisites:</Text>
                            <View style={localStyles.multiSelectContainer}>
                                {form.prerequisites.map((course) => (
                                    <View key={course.id} style={localStyles.prereqPill}>
                                        <Text style={localStyles.prereqText}>{course.title}</Text>
                                        <Pressable onPress={() => setForm({ ...form, prerequisites: form.prerequisites.filter(p => p.id !== course.id) })}>
                                            <X size={14} color="#666" />
                                        </Pressable>
                                    </View>
                                ))}
                                
                                <Pressable style={localStyles.addPrereqBtn} onPress={() => setShowPrereqDropdown(!showPrereqDropdown)}>
                                    <Plus size={16} color="#217837" />
                                    <Text style={localStyles.addPrereqText}>Add Course</Text>
                                </Pressable>
                            </View>
                            {showPrereqDropdown && (
                                <View style={localStyles.Tagdropdown}>
                                    <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 150 }}>
                                        {allCourseList.filter(c => c.id !== initialData?.id).map(course => (
                                            <Pressable key={course.id} style={localStyles.TagdropdownItem} onPress={() => addPrerequisite(course)}>
                                                <Text>{course.title}</Text>
                                            </Pressable>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                            {errors.prerequisites && <Text style={localStyles.errorText}>{errors.prerequisites}</Text>}
                        </View>
                    </View>

                    {/* Upload Section */}
                    <View style={styles.upload}>
                        <Text style={styles.label}>Course Cover</Text>
                        <Pressable style={styles.imagePicker} onPress={() => pickImage('cover')}>
                            {getImageUri(form.image) ? (
                                <Image source={{ uri: getImageUri(form.image) }} style={styles.previewImage} />
                            ) : (
                                <View style={localStyles.uploadPlaceholder}>
                                    <Image source={require('../../assets/upload_placeholder.png')} style={localStyles.placeholder} />
                                    <Text style={localStyles.muted}>Select image</Text>
                                </View>
                            )}
                        </Pressable>

                        <Text style={[styles.label, { marginTop: 25 }]}>Completion Badge (1:1)</Text>
                        <Pressable style={localStyles.badgePicker} onPress={() => pickImage('badge')}>
                            {getImageUri(form.badgeImage) ? (
                                <Image source={{ uri: getImageUri(form.badgeImage) }} style={localStyles.badgePreview} />
                            ) : (
                                <View style={localStyles.uploadPlaceholder}>
                                    <Award size={32} color="#ccc" />
                                    <Text style={[localStyles.muted, { fontSize: 10 }]}>Upload Badge</Text>
                                </View>
                            )}
                        </Pressable>
                        {errors.badgeImage && <Text style={[localStyles.errorText, { textAlign: 'center' }]}>{errors.badgeImage}</Text>}
                    </View>
                </View>
            </ScrollView>

            {/* Footer Buttons - Fixed at Bottom */}
            <View style={[styles.row, { padding: 20, paddingTop: 0, borderTopWidth: 1, borderTopColor: '#eee', gap: 10 }]}>
                <Pressable style={[styles.Btn, { flex: 1 }]} onPress={handleSubmit} disabled={isLoading}>
                    {isLoading ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', textAlign: 'center' }}>{initialData ? 'Update' : 'Add'}</Text>}
                </Pressable>
                
                {initialData && (
                    <Pressable 
                        style={[styles.Btn, localStyles.Publishbtn, { flex: 1 }]} 
                        onPress={form.status === "unreleased" ? handlePublish : handleUnpublish}
                        disabled={isLoading}
                    >
                        <Text style={localStyles.publishText}>
                            {form.status === "unreleased" ? 'Publish' : 'Unpublish'}
                        </Text>
                    </Pressable>
                )}
            </View>
        </View>
    );
};

const localStyles = StyleSheet.create({
    inputGroup: { marginBottom: 15 },
    errorText: { color: 'red', fontSize: 12 },
    placeholder: { width: 70, height: 70, borderRadius: 10 },
    uploadPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
    muted: { color: "#646464" },
    Publishbtn: { backgroundColor: '#18704d' },
    publishText: { color: 'white', textAlign: 'center' },
    multiSelectContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 5,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        backgroundColor: '#fdfdfd',
        minHeight: 35,
        width: '100%'
    },
    pill: {
        backgroundColor: '#217837',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    pillText: { color: 'white', fontSize: 12, fontWeight: '500' },
    prereqPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e8f5e9',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#c8e6c9',
        gap: 8,
    },
    prereqText: { fontSize: 12, color: '#2e7d32', fontWeight: '500' },
    addTagBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, width: '100%' },
    addTagText: { color: '#217837', fontSize: 12, fontWeight: '600' },
    addPrereqBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, width: '100%' },
    addPrereqText: { color: '#217837', fontSize: 12, fontWeight: '600' },
    badgePicker: {
        width: 150,
        height: 150,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#ccc',
        borderRadius: 12,
        backgroundColor: '#f9f9f9',
        alignSelf: 'center',
        overflow: 'hidden'
    },
    badgePreview: { width: '100%', height: '100%', resizeMode: 'cover' },
    Tagdropdown: {
        backgroundColor: 'white',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#eee',
        elevation: 3,
        zIndex: 1000
    },
    TagdropdownItem: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        flexDirection: 'row',
        alignItems: 'center'
    },
});

export default CourseFormContent;