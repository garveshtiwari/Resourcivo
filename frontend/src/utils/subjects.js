// Subject dropdown with an "Other" option (faculty forms)
export const OTHER = '__other__';

export const subjectFields = (subjects) => [
    {
        name: 'subjectChoice',
        label: 'Subject',
        type: 'select',
        required: true,
        options: [...subjects.map((s) => ({ value: s.name, label: s.name })), { value: OTHER, label: 'Other…' }],
    },
    {
        name: 'subjectOther',
        label: 'Your subject',
        required: true,
        maxLength: 100,
        placeholder: 'e.g. Robotics',
        showIf: (values) => values.subjectChoice === OTHER,
    },
];

// Initial dropdown state for an existing record: a listed subject, or "Other" + its text
export const subjectInitial = (name, subjects) => {
    if (!name) return {};
    return subjects.some((s) => s.name === name)
        ? { subjectChoice: name }
        : { subjectChoice: OTHER, subjectOther: name };
};

// Turn the two form fields into the { subject: { name } } the API expects
export const applySubject = (payload) => {
    const { subjectChoice, subjectOther, ...rest } = payload;
    const name = subjectChoice === OTHER ? subjectOther : subjectChoice;
    return name && name.trim() ? { ...rest, subject: { name: name.trim() } } : rest;
};
