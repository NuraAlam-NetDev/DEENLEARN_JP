import { useMemo, useState } from 'react';

// Small form helper with inline validation.
//   validate(values) -> { fieldName: 'message' }   (module-level function, so it stays stable)
// Errors show after a field is left (blur) or after the first submit attempt.
// Server-side field errors can be added with setServerErrors and clear when the field is edited.
export function useForm({ initialValues, validate }) {
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState({});

  const allErrors = useMemo(() => validate(values), [validate, values]);

  const errors = useMemo(() => {
    const shown = {};
    for (const [field, message] of Object.entries(allErrors)) {
      if (submitted || touched[field]) shown[field] = message;
    }
    return { ...serverErrors, ...shown };
  }, [allErrors, submitted, touched, serverErrors]);

  function onChange(e) {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    setServerErrors((s) => {
      if (!s[name]) return s;
      const next = { ...s };
      delete next[name];
      return next;
    });
  }

  function onBlur(e) {
    const { name } = e.target;
    setTouched((t) => ({ ...t, [name]: true }));
  }

  // <form onSubmit={handleSubmit(async (values) => {...})} noValidate>
  const handleSubmit = (submit) => async (e) => {
    e.preventDefault();
    setSubmitted(true);

    const firstInvalid = Object.keys(allErrors)[0];
    if (firstInvalid) {
      e.currentTarget.elements[firstInvalid]?.focus();
      return;
    }
    await submit(values);
  };

  return { values, errors, onChange, onBlur, handleSubmit, setServerErrors };
}
