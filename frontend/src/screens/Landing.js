import { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Image,
    Animated,
    StatusBar,
} from 'react-native';

const IMAGES = [
    require('../../assets/forest1.jpg'),
    require('../../assets/forest2.jpg'),
    require('../../assets/forest3.jpg'),
    require('../../assets/forest4.jpg'),
]

const DISPLAY_DURATION = 4000;
const FADE_DURATION = 1500;

const Landing = ({ navigation }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [nextIndex, setNextIndex] = useState(null);
    const nextOpacity = useRef(new Animated.Value(0)).current;

    const contentFade = useRef(new Animated.Value(0)).current;
    const contentSlide = useRef(new Animated.Value(20)).current;
    const btnFade = useRef(new Animated.Value(0)).current;
    const btnScale = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(btnScale, {
            toValue: 1.05,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(btnScale, {
            toValue: 1,
            friction: 5,
            useNativeDriver: true,
        }).start();
    };

    const getRandomNext = (current) => {
        let next;
        do {
            next = Math.floor(Math.random() * IMAGES.length);
        } while (next === current);
        return next;
    };

    useEffect(() => {
        const cycle = () => {
            const next = getRandomNext(currentIndex);
            setNextIndex(next);
            nextOpacity.setValue(0);

            Animated.timing(nextOpacity, {
              toValue: 1,
              duration: FADE_DURATION,
              useNativeDriver: true,
            }).start(() => {
              setCurrentIndex(next);
              setNextIndex(null);
            });
        };

        const timer = setTimeout(cycle, DISPLAY_DURATION);
        return () => clearTimeout(timer);
    }, [currentIndex]);
        
    useEffect(() => {
        Animated.sequence([
            Animated.delay(500),
            Animated.parallel([
                Animated.timing(contentFade, {
                    toValue: 1,
                    duration: 900,
                    useNativeDriver: true,
                }),
                Animated.timing(contentSlide, {
                    toValue: 0,
                    duration: 900,
                    useNativeDriver: true,
                }),
            ]),
            Animated.delay(300),
            Animated.timing(btnFade, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
 
            {/* Current image (always visible underneath) */}
            <Image
                source={IMAGES[currentIndex]}
                style={styles.bg}
                accessibilityLabel="Forest background"
            />
 
            {/* Next image fades in on top */}
            {nextIndex !== null && (
                <Animated.Image
                    source={IMAGES[nextIndex]}
                    style={[styles.bg, { opacity: nextOpacity }]}
                    accessibilityLabel="Forest background"
                />
            )}
 
            {/* Overlay */}
            <View style={styles.overlay} />
 
            {/* Centered content */}
            <View style={styles.content}>
                <Animated.Text
                    style={[
                        styles.headline,
                        {
                            opacity: contentFade,
                            transform: [{ translateY: contentSlide }],
                        },
                    ]}
                >
                    Protect Sarawak's{"\n"}Natural Heritage
                </Animated.Text>
 
                <Animated.Text
                    style={[
                        styles.body,
                        {
                            opacity: contentFade,
                            transform: [{ translateY: contentSlide }],
                        },
                    ]}
                >
                    The official learning and compliance portal for Sarawak Forestry
                    Corporation staff and park guides.{"\n"}Build your skills, complete
                    required training, and stay ready for the field.
                </Animated.Text>
 
                <Animated.View
                    style={{
                        opacity: btnFade,
                        alignSelf: 'center',
                        transform: [{ scale: btnScale }],
                    }}
                >
                    <Pressable
                        style={styles.ctaBtn}
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                        onHoverIn={handlePressIn}
                        onHoverOut={handlePressOut}
                        onPress={() => navigation.replace('Login')}
                    >
                        <Text style={styles.ctaBtnText}>Get Started</Text>
                    </Pressable>
                </Animated.View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0b1f08',
    },
    bg: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(5, 18, 3, 0.52)',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        gap: 18,
    },
    headline: {
        color: '#ffffff',
        fontSize: 38,
        fontWeight: '800',
        lineHeight: 46,
        letterSpacing: -0.5,
        textAlign: 'center',
    },
    body: {
        color: '#b8d4b0',
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'center',
    },
    ctaBtn: {
        backgroundColor: 'rgba(255,255,255,1)',
        borderRadius: 50,
        paddingVertical: 16,
        paddingHorizontal: 32,
        alignItems: 'center',
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#ffffff',
    },
    ctaBtnPressed: {
        opacity: 0.7,
    },
    ctaBtnText: {
        color: '#000000',
        fontSize: 17,
        fontWeight: '700',
    },
});
 
export default Landing;