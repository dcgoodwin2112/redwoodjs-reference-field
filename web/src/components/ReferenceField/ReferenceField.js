import { useQuery } from '@redwoodjs/web'
import { useReducer, useEffect } from 'react'
import { HiddenField, TextField } from '@redwoodjs/forms'

/**
 *  Input below filter cutoff will only search beginning of search fields
 *  User input above or equal to filter cutoff will search entire string
 *  This is intended to reduce results for small input strings
 */
const FILTER_CUTOFF = 3

const useReferenceField = (refQuery, searchKey, searchFields, defaultValue) => {
  const { data, loading, error } = useQuery(refQuery)
  const initial = { value: '', selected: defaultValue ?? null, suggest: [] }

  const reducer = (state, action) => {
    switch (action.type) {
      case 'init': {
        if (state.selected) {
          const result = data[searchKey].find((item) => {
            return item.id == state.selected ? true : false
          })
          if (result) {
            const filtered = searchFields.reduce(
              (acc, cur) => {
                return { ...acc, [cur]: result[cur] }
              },
              { id: result.id }
            )
            return { ...state, value: Object.values(filtered).join(', ') }
          }
        }
        return state
      }
      case 'change': {
        if (action.value.length === 0) {
          return { ...state, value: action.value, suggest: [] }
        }
        const matches = data[searchKey].filter((element) => {
          for (const key of searchFields) {
            if (action.value.length < FILTER_CUTOFF) {
              if (element[key].startsWith(action.value)) {
                return true
              }
            } else {
              if (element[key].includes(action.value)) {
                return true
              }
            }
          }
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

  return [state, dispatch, data, loading, error]
}

const ReferenceField = (props) => {
  const [state, dispatch, data, loading, error] = useReferenceField(
    props.refQuery,
    props.searchKey,
    props.searchFields,
    props?.defaultValue
  )

  // This useEffect call is needed to update reference input field
  // once data loading is complete.
  useEffect(() => {
    if (loading) return
    dispatch({ type: 'init' })
  }, [loading, dispatch])

  return (
    <div>
      <HiddenField name={props.name} value={state.selected ?? ''} />
      <TextField
        name="refInput"
        className="rw-input"
        autoComplete="off"
        value={state.value ?? ''}
        onChange={(e) => dispatch({ type: 'change', value: e.target.value })}
      />
      {state.suggest.length > 0 && (
        <ReferenceFieldSuggest
          state={state}
          dispatch={dispatch}
          searchFields={props.searchFields}
        />
      )}
    </div>
  )
}

const ReferenceFieldSuggest = ({ state, dispatch, searchFields }) => {
  const results = state.suggest.map((option) => {
    return searchFields.reduce(
      (acc, cur) => {
        return { ...acc, [cur]: option[cur] }
      },
      { id: option.id }
    )
  })

  return (
    <div
      style={{
        border: '1px solid #dddddd',
        borderRadius: '0.5rem',
        padding: '1rem',
      }}
    >
      <ul style={{ listStyleType: 'none' }}>
        {state.suggest &&
          results.map((item) => {
            return (
              <li key={item.id}>
                <button
                  data-option={item.id}
                  onClick={(e) =>
                    dispatch({ type: 'select', target: e.target })
                  }
                  type="button"
                  style={{
                    backgroundColor: 'unset',
                    color: 'blue',
                    textDecoration: 'underline',
                  }}
                >
                  {Object.values(item).join(', ')}
                </button>
              </li>
            )
          })}
      </ul>
    </div>
  )
}

export { ReferenceField }
