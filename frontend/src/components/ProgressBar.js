import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

let Svg, Circle;

if(Platform.OS!=='web'){
  const SvgLib=require('react-native-svg');
  Svg=SvgLib.default || SvgLib.Svg;
  Circle=SvgLib.Circle;
}

const ProgressBar = ({ progress }) => {
  const percentage = Math.round(progress * 100);

  if(Platform.OS !== 'web'){
    const size=30;
    const strokeWidth=5;
    const radius=(size-strokeWidth)/2;
    const circumference=radius*2 * Math.PI;
    const strokeDashoffset=circumference - (progress * circumference);

    return(
      <View style={styles.circularContainer}>
        <Svg width={size} height={size}>
          <Circle
            cx={size/2}
            cy={size/2}
            r={radius}
            stroke="#EEE"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <Circle
            cx={size/2}
            cy={size/2}
            r={radius}
            stroke="#ffb116"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            rotation="-90"
            origin={`${size/2}, ${size/2}`}
          />
        </Svg>
        <Text style={styles.circularLabel}>{percentage}%</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: '#000000' }]}>
        {percentage}%
      </Text>

      <View style={[styles.bar, { width: `${percentage}%` }]}>
        <View style={styles.textMaskWrapper}>
          <Text style={[styles.label, { color: '#ffffff' }]}>
            {percentage}%
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 35,
    backgroundColor: '#EEE',
    borderRadius: 6,
    overflow: 'hidden',
    marginVertical: 5,
    justifyContent: 'center',
    position: 'relative',
  },
  bar: {
    height: '100%',
    backgroundColor: '#2a6027',
    borderRadius: 10,
    overflow: 'hidden', 
    position: 'absolute',
    left: 0,
    top: 0,
    justifyContent: 'center',
  },
  textMaskWrapper: {
    width: 1000, 
    position: 'absolute',
    left: 0,
    justifyContent: 'center',
  },
  label: {
    textAlign: 'center',
    width: '100%',
    zIndex: 1,
    whiteSpace: 'nowrap', 
    flexShrink: 0,
    ...Platform.select({
      web: { 
        whiteSpace: 'nowrap',
        userSelect: 'none' 
      }
    })
  },
  circularContainer:{
    justifyContent:'center',
    alignItems:'center',
    width:50,
    height:50
  },
  circularLabel:{
    position:'absolute',
    fontSize:10,
    fontWeight:'bold',
    color:'#333'
  }
});

export default ProgressBar;