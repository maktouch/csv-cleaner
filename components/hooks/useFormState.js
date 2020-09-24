import { useState, useCallback } from "react";

export function useFormState(_initialState = {}) {
  const [initialState, _setInitialState] = useState(_initialState);
  const [values, setValues] = useState(_initialState);
  const [dirty, setDirtyItems] = useState(new Set());
  const [touched, setTouchedItems] = useState(new Set());

  const setValue = useCallback(
    function (name, value, makeTouched = true, makeDirty = true) {
      setValues((state) => ({
        ...state,
        [name]: value,
      }));

      makeTouched && setTouchedItems((state) => state.add(name));

      if (makeDirty) {
        if (initialState[name]) {
          if (typeof value === "object") {
            if (JSON.stringify(value) === JSON.stringify(initialState[name])) {
              setDirtyItems((state) => {
                state.delete(name);
                return state;
              });
            } else {
              setDirtyItems((state) => state.add(name));
            }
          } else {
            if (value === initialState[name]) {
              setDirtyItems((state) => {
                state.delete(name);
                return state;
              });
            } else {
              setDirtyItems((state) => state.add(name));
            }
          }
        } else {
          if (value === "" || value === false) {
            setDirtyItems((state) => {
              state.delete(name);
              return state;
            });
          } else {
            setDirtyItems((state) => state.add(name));
          }
        }
      }
    },
    [initialState]
  );

  const setInitialState = useCallback(function (state) {
    _setInitialState(state);
    setValues(state);
    setDirtyItems(new Set());
    setTouchedItems(new Set());
  }, []);

  const clear = useCallback(function (name) {
    setValues((state) => ({
      ...state,
      [name]: "",
    }));

    setDirtyItems(new Set());
    setTouchedItems(new Set());
  }, []);

  const text = function (name, options = {}) {
    const { onChange } = options;

    return {
      name,
      get value() {
        return values[name] || "";
      },
      onChange: (event) => {
        setValue(name, event.target.value);
        onChange && onChange(event);
      },
    };
  };

  const radio = function (name, value, options = {}) {
    const { onChange } = options;
    return {
      name,
      value,
      get checked() {
        return values[name] === value;
      },
      onChange: (event) => {
        setValue(name, event.target.value);
        onChange && onChange(event);
      },
    };
  };

  const checkbox = function (name, value, options = {}) {
    const { onChange } = options;
    const isArray = name.includes("[]");

    return {
      name,
      value,
      get checked() {
        if (isArray) {
          return (values[name] || []).includes(value);
        }

        return values[name] || false;
      },
      onChange: (event) => {
        if (isArray) {
          const copy = [...(values[name] ?? [])];

          if (event.target.checked) {
            copy.push(value);
          } else {
            const index = copy.indexOf(value);

            if (index > -1) {
              copy.splice(index, 1);
            }
          }

          setValue(name, copy);
        } else {
          setValue(name, event.target.checked);
        }

        onChange && onChange(event);
      },
    };
  };

  const raw = function (name, options = {}) {
    const { onChange } = options;
    return {
      name,
      get value() {
        return values[name];
      },
      onChange: (value) => {
        setValue(name, value);
        onChange && onChange(value);
      },
    };
  };

  return [
    values,
    {
      text,
      radio,
      checkbox,
      select: text,
      raw,

      setValue,
      clear,
      setInitialState,
      dirty,
      touched,
    },
  ];
}
