import { InformationCircleIcon } from '@heroicons/react/24/outline'

const SettingsCheckbox = ({
  id,
  title,
  isChecked,
  onChange,
  description = undefined,
}: {
  id: string
  title: string
  description?: string
  isChecked: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) => {
  return (
    <div className="relative flex items-start">
      <div className="flex h-6 items-center">
        <input
          id={id}
          aria-describedby={`${id}-description`}
          name={id}
          type="checkbox"
          onChange={onChange}
          checked={isChecked}
          className="h-4 w-4 rounded border-gray-300 p-2 text-blue-500 focus:ring-blue-500"
        />
      </div>
      <div className="ml-2.5 inline-flex items-center space-x-4 text-sm leading-6 ">
        <label htmlFor={id} className="text-gray-900">
          {title}
        </label>{' '}
        {description && (
          <span
            id={`${id}-description`}
            className="inline-flex items-center space-x-1 text-gray-500"
          >
            <InformationCircleIcon className="h-6 w-6" />
            <span>{description}</span>
          </span>
        )}
      </div>
    </div>
  )
}

export default SettingsCheckbox
