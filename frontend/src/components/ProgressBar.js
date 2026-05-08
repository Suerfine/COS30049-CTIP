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
    const size=40;
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
      <View style={[styles.bar, { width: `${percentage}%` }]} />
      <Text style={styles.label}>{percentage}%</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 20,
    backgroundColor: '#EEE',
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bar: {
    height: '100%',
    backgroundColor: '#ffb116',
    borderRadius: 10,
  },
  label: {
    position: 'absolute',
    alignSelf: 'center',
    width: '100%',
    textAlign: 'center',
    color: '#000000',
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