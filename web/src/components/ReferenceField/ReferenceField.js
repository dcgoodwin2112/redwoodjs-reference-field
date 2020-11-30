import { useQuery } from '@redwoodjs/web'
import { useReducer, useEffect } from 'react'
import { HiddenField, TextField } from '@redwoodjs/forms'
import styles from './ReferenceField.module.css'

/**
 *  Input below filter cutoff will only search beginning of search fields
 *  User input above or equal to filter cutoff will search entire string
 *  This is intended to reduce results for small input strings
 */
const FILTER_CUTOFF = 3

// Filter an object record down to searchable fields
const filterObj = (obj, searchFields) => {
  return searchFields.reduce((acc, cur) => {
    return { ...acc, [cur]: obj[cur] }
  }, {})
}

// Convert an object to text output to display to user
const objToText = (obj, searchFields) => {
  const output = []
  for (const [key, value] of Object.entries(filterObj(obj, searchFields))) {
    output.push(`${key}: ${value}`)
  }
  return output.join(', ') + ` (${obj.id})`
}

// Check if user input matches any of the current search fields
const isMatch = (obj, searchFields, input) => {
  for (const field of searchFields) {
    if (input.length < FILTER_CUTOFF) {
      if (obj[field].startsWith(input)) return true
    } else {
      if (obj[field].includes(input)) return true
    }
  }
  return false
}

const useReferenceField = (refQuery, searchKey, searchFields, defaultValue) => {
  const { data, loading, error } = useQuery(refQuery)
  const initial = { value: '', selected: defaultValue ?? null, suggest: [] }

  const reducer = (state, action) => {
    switch (action.type) {
      case 'init': {
        if (state.selected) {
          const obj = data[searchKey].find((item) => {
            return item.id == state.selected ? true : false
          })
          if (obj) {
            return { ...state, value: objToText(obj, searchFields) }
          }
        }
        return state
      }
      case 'change': {
        if (action.value.length === 0) {
          return { ...state, value: action.value, suggest: [] }
        }
        const matches = data[searchKey].filter((obj) => {
          return isMatch(obj, searchFields, action.value)
        })
        return {
          ...state,
          value: action.value,
          suggest: matches ? matches : [],
        }
      }
      case 'select':
        return {
          ...state,
          value: action.target.innerText,
          selected: action.target.dataset.option,
          suggest: [],
        }
      default:
        throw new Error('Kaboom!')
    }
  }

  const [state, dispatch] = useReducer(reducer, initial)

  return [state, dispatch, loading]
}

const ReferenceField = (props) => {
  const [state, dispatch, loading] = useReferenceField(
    props.refQuery,
    props.searchKey,
    props.searchFields,
    props?.defaultValue
  )

  // Update user input field after data has loaded
  useEffect(() => {
    if (loading) return
    dispatch({ type: 'init' })
  }, [loading, dispatch])

  return (
    <div>
      <HiddenField name={props.name} value={state?.selected ?? ''} />
      <TextField
        className="rw-input"
        autoComplete="off"
        value={state.value ?? ''}
        onChange={(e) => dispatch({ type: 'change', value: e.target.value })}
      />
      {state.suggest.length > 0 ? (
        <>
          <ReferenceFieldSuggest
            state={state}
            dispatch={dispatch}
            searchFields={props.searchFields}
          />
        </>
      ) : (
        <small>
          Begin typing in the text field above to view possible values.
        </small>
      )}
    </div>
  )
}

const ReferenceFieldSuggest = ({ state, dispatch, searchFields }) => {
  return (
    <div className={styles.container}>
      <ul className={styles.ul}>
        {state.suggest &&
          state.suggest.map((obj) => {
            return (
              <li key={obj.id}>
                <button
                  data-option={obj.id}
                  onClick={(e) =>
                    dispatch({ type: 'select', target: e.target })
                  }
                  type="button"
                  className={`${styles.button} rw-link`}
                >
                  {objToText(obj, searchFields)}
                </button>
              </li>
            )
          })}
      </ul>
    </div>
  )
}

export { ReferenceField }
