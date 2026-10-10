import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

type OtpInputProps = {
    value: string;
    onChange: (value: string) => void;
    length?: number;
    hasError?: boolean;
    editable?: boolean;
};

/**
 * Segmented one-time-code field. A single hidden TextInput captures input
 * (keeping OS one-time-code autofill working) while glossy boxes render each digit.
 */
export function OtpInput({ value, onChange, length = 6, hasError = false, editable = true }: OtpInputProps) {
    const inputRef = useRef<TextInput>(null);
    const [focused, setFocused] = useState(false);
    const digits = Array.from({ length }, (_, index) => value[index] ?? '');

    const focusInput = () => {
        if (editable) inputRef.current?.focus();
    };

    return (
        <Pressable onPress={focusInput} style={styles.row}>
            {digits.map((digit, index) => {
                const isActive = focused && index === Math.min(value.length, length - 1);
                const boxStyle = [
                    styles.box,
                    hasError && styles.boxError,
                    !hasError && isActive && styles.boxActive,
                    !hasError && !isActive && digit.length > 0 && styles.boxFilled,
                ];
                return (
                    <View key={index} style={boxStyle}>
                        <Text style={[styles.digit, isActive && styles.digitActive]}>{digit}</Text>
                    </View>
                );
            })}
            <TextInput
                ref={inputRef}
                autoCapitalize="none"
                autoComplete="sms-otp"
                editable={editable}
                keyboardType="number-pad"
                maxLength={length}
                onBlur={() => setFocused(false)}
                onChangeText={(text) => onChange(text.replace(/[^0-9]/g, '').slice(0, length))}
                onFocus={() => setFocused(true)}
                style={styles.hiddenInput}
                textContentType="oneTimeCode"
                value={value}
            />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        gap: DesignSpacing.sm,
        justifyContent: 'center',
    },
    box: {
        flex: 1,
        maxWidth: 52,
        height: 60,
        borderRadius: DesignRadius.lg,
        borderWidth: 1,
        borderColor: DesignColors.cardBorder,
        backgroundColor: DesignColors.surfaceContainerLow,
        alignItems: 'center',
        justifyContent: 'center',
    },
    boxActive: {
        borderColor: DesignColors.primary,
        backgroundColor: DesignColors.primaryTint,
    },
    boxFilled: {
        borderColor: DesignColors.primaryTintBorder,
        backgroundColor: DesignColors.primaryTint,
    },
    boxError: {
        borderColor: DesignColors.error,
        backgroundColor: DesignColors.dangerContainer,
    },
    digit: {
        ...DesignTypography.headlineMd,
        color: DesignColors.textPrimary,
        fontFamily,
    },
    digitActive: {
        color: DesignColors.onPrimaryContainer,
    },
    hiddenInput: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        opacity: 0,
        // fontSize >= 16 prevents the iOS zoom-on-focus jolt.
        fontSize: 16,
        color: 'transparent',
    },
});
