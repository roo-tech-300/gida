import { validatePlaceReview } from '@/utils/validate-place-review';

describe('validatePlaceReview', () => {
  it('rejects a submission without a star rating', () => {
    const error = validatePlaceReview(0, 'Nice quiet place to study.');

    expect(error).toEqual({
      field: 'rating',
      message: 'Please select a star rating before submitting.',
    });
  });

  it('rejects a submission with an empty review body', () => {
    const error = validatePlaceReview(4, '   ');

    expect(error).toEqual({
      field: 'text',
      message: 'Please write a short review before submitting.',
    });
  });

  it('reports the rating error first when both fields are missing', () => {
    const error = validatePlaceReview(0, '');

    expect(error?.field).toBe('rating');
  });

  it('accepts a rating with review text', () => {
    expect(validatePlaceReview(5, 'Best jollof around.')).toBeNull();
  });
});
