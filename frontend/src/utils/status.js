// Badge tones for backend enums.
export const issueTone = (status) =>
    ({ PENDING: 'amber', ISSUED: 'blue', RETURN_REQUESTED: 'purple', REJECTED: 'red', RETURNED: 'green' }[status] || 'slate');

export const equipmentTone = (status) =>
    ({ OPERATIONAL: 'green', UNDER_MAINTENANCE: 'amber', DAMAGED: 'red', RETIRED: 'slate' }[status] || 'slate');

export const toOptions = (values, titleCase) => values.map((v) => ({ value: v, label: titleCase(v) }));
