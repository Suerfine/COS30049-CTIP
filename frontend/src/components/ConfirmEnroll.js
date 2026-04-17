import { View, Text, Pressable } from 'react-native';
import ModalLayout from './ModalLayout';
import { ModalStyle as styles } from './ModalStyle';
import {X} from 'lucide-react-native';

const ConfirmEnroll = ({ visible, course, onClose, onConfirm }) => {
    if (!course) return null;

    return (
        <ModalLayout visible={visible} onClose={onClose}>
            <View style={styles.container}>

                {/* Header */}
                <View style={[styles.row, styles.header]}>
                    <Text style={styles.title}>Confirm Enrollment</Text>
                    <X onPress={onClose} />
                </View>

                {/* Content */}
                <View style={styles.content}>
                    <Text style={styles.label}>Course</Text>
                    <Text>{course.title}</Text>

                    <Text style={styles.label}>Duration</Text>
                    <Text>{course.duration}</Text>

                    <Text style={styles.label}>Expiry</Text>
                    <Text>{course.expiry}</Text>

                    <Text style={styles.label}>Modules</Text>
                    <Text>{course.modules}</Text>
                </View>

                {/* Buttons */}
                <View style={[styles.row, { justifyContent: 'flex-end', marginTop: 20 }]}>

                    <Pressable onPress={onConfirm} style={styles.Btn}>
                        <Text>Confirm</Text>
                    </Pressable>
                </View>

            </View>
        </ModalLayout>
    );
};

export default ConfirmEnroll;