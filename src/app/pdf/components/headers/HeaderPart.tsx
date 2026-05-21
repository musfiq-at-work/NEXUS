import { View, Text, StyleSheet } from '@react-pdf/renderer';
import React from 'react';
import type { HeaderData } from '~/types/pdf';

interface OrderHeaderProps {
  data: HeaderData;
}

const HeaderPart: React.FC<OrderHeaderProps> = ({ data }) => {
  return (
    <View style={styles.container}>
        {data.map((column, colIndex) => (
            <View key={colIndex} style={styles.column}>
                {column.map((item, rowIndex) => (
                    <View key={`${colIndex}-${rowIndex}`} style={styles.row}>
                        <Text style={styles.label}>{item.label}: </Text>
                        <Text style={styles.value}>{item.value}</Text>
                    </View>
                ))}
            </View>
        ))}
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-around",
        paddingBottom: 10,
        marginTop: 10,
    },
    column: {
        flexDirection: 'column',
    },
    row: {
        flexDirection: 'row',
    },
    label: {
        fontSize: 9,
        fontFamily: 'poppins',
    },
    value: {
        fontSize: 9,
        fontFamily: 'poppins',
    },
});

export default React.memo(HeaderPart);