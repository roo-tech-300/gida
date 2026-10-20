import type { TextInputProps } from 'react-native';

export type PersonalInfoFieldId = 'fullName' | 'username' | 'bio';

export type PersonalInfoFieldConfig = {
  id: PersonalInfoFieldId;
  title: string;
  subtitle: string;
  label: string;
  helper: string;
  inputProps: Pick<
    TextInputProps,
    'autoCapitalize' | 'autoCorrect' | 'autoComplete' | 'textContentType' | 'multiline' | 'numberOfLines' | 'textAlignVertical'
  >;
};

export const BIO_MAX_LENGTH = 300;

export const EMAIL_LOCK_MESSAGE =
  "You can't change your email until 30 days after creating an account.";

export function getFieldConfig(id: PersonalInfoFieldId): PersonalInfoFieldConfig | undefined {
  return PERSONAL_INFO_FIELDS.find((field) => field.id === id);
}

export const PERSONAL_INFO_FIELDS: readonly PersonalInfoFieldConfig[] = [
  {
    id: 'fullName',
    title: 'Full name',
    subtitle: 'This is the name other students see across Gida.',
    label: 'Full name',
    helper: 'Use the name your school knows you by.',
    inputProps: {
      autoCapitalize: 'words',
      autoComplete: 'name',
      textContentType: 'name',
    },
  },
  {
    id: 'username',
    title: 'Username',
    subtitle: 'Your unique @handle on Gida. Friends can find you with it.',
    label: 'Username',
    helper: '3-30 characters. Lowercase letters, numbers, dots and underscores.',
    inputProps: {
      autoCapitalize: 'none',
      autoCorrect: false,
      autoComplete: 'username',
      textContentType: 'username',
    },
  },
  {
    id: 'bio',
    title: 'Bio',
    subtitle: 'A short intro that helps roommates and hosts get to know you.',
    label: 'Bio',
    helper: 'Up to 300 characters. You can leave this empty for now.',
    inputProps: {
      multiline: true,
      numberOfLines: 4,
      textAlignVertical: 'top',
      autoCapitalize: 'sentences',
      autoComplete: 'off',
      textContentType: 'none',
    },
  },
] as const;