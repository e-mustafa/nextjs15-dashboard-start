'use client';

import useLocale from '@/hooks/useLocale';
import arabic from 'react-date-object/calendars/arabic';
import gregorian from 'react-date-object/calendars/gregorian';
import arabic_ar from 'react-date-object/locales/arabic_ar';
import arabic_en from 'react-date-object/locales/arabic_en';
import gregorian_ar from 'react-date-object/locales/gregorian_ar';
import gregorian_en from 'react-date-object/locales/gregorian_en';

import { Button } from '@/components/ui-custom/custom-button';
import { TLocalesData } from '@/configs/general';
import { cn } from '@/lib/utils';
import '@/styles/multi-date-picker.css';
import { useEffect, useMemo, useState } from 'react';
import { Calendar, DateObject } from 'react-multi-date-picker';
import highlightWeekends from 'react-multi-date-picker/plugins/highlight_weekends';
import TimePicker from 'react-multi-date-picker/plugins/time_picker';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Switch } from '../ui/switch';

export enum CalendarType {
	GREGORIAN = 'gregorian',
	HIJRI = 'hijri',
}

export enum EnumDatePickerMode {
	SINGLE = 'SINGLE',
	RANGE = 'RANGE',
	MULTIPLE = 'MULTIPLE',
}

const dbFormat = 'YYYY-MM-DD';
const dbFormatWTime = 'YYYY-MM-DD HH:mm';

const displayFormat = 'DD MMMM, YYYY';
const displayFormatWTime = 'hh:mm A  DD MMMM, YYYY';

const meridiems_ar = [
	['صباحا', 'ص.ب'],
	['مساءً', 'م.س'],
];

const monthsHijri_ar = [
	['محرم', 'محرم'],
	['صفر', 'صفر'],
	['ربیع الاول', 'ربیع الاول'],
	['ربیع الثانی', 'ربیع الثانی'],
	['جمادی الاول', 'جمادی الاول'],
	['جمادی الثانی', 'جمادی الثانی'],
	['رجب', 'رجب'],
	['شعبان', 'شعبان'],
	['رمضان', 'رمضان'],
	['شوال', 'شوال'],
	['ذو القعده ', 'ذو القعده'],
	['ذو الحجه', 'ذو الحجه'],
];

interface MultiDatePickerProps {
	name?: string;
	value?: string | string[] | null; // القيمة من الـ DB (gregorian format)
	onChange?: (selectedDates: string | string[] | null) => void;
	calendarType?: CalendarType;
	language?: TLocalesData;
	mode?: EnumDatePickerMode;
	range?: boolean;
	multiple?: boolean;
	timePicker?: boolean;
	placeholder?: string;
	disabled?: boolean;
	inputClass?: string;
	dateOptions: {
		minDate?: string;
		maxDate?: string;
		disabledDates?: string[];
		onlyAllowedDates?: string[];
	};
}

export default function MultiDatePicker({
	value = null,
	onChange,
	name,
	calendarType = CalendarType.GREGORIAN,
	language,
	mode = EnumDatePickerMode.SINGLE,
	range = mode === EnumDatePickerMode.RANGE,
	multiple = mode === EnumDatePickerMode.MULTIPLE,
	timePicker = false,
	placeholder = 'forms.placeholders.date',
	disabled = false,
	inputClass,
	dateOptions: { minDate, maxDate, disabledDates = [], onlyAllowedDates = [] } = {},
}: MultiDatePickerProps) {
	const { t, locale } = useLocale();
	language = language || locale || 'en';

	const [calenderTp, setCalenderTp] = useState(calendarType);
	const dbFormatMode = timePicker ? dbFormatWTime : dbFormat;

	// Display format for the calendar and input
	const screenFormat = timePicker ? displayFormatWTime : displayFormat;

	// Convert DB value (gregorian) to DateObject for calendar display
	const dateObjectValue = useMemo(() => {
		if (!value) return null;

		try {
			if (Array.isArray(value)) {
				// Range or Multiple mode
				return value.map((dateStr) => {
					const dateObj = new DateObject({
						date: dateStr,
						format: dbFormatMode,
						calendar: gregorian,
						locale: gregorian_en,
					});

					// Convert to selected calendar type for display
					if (calenderTp === CalendarType.HIJRI) {
						return dateObj.convert(arabic, locale === 'ar' ? arabic_ar : arabic_en);
					}
					return dateObj.convert(gregorian, locale === 'ar' ? gregorian_ar : gregorian_en);
				});
			} else {
				// Single mode
				const dateObj = new DateObject({
					date: value,
					format: dbFormatMode,
					calendar: gregorian,
					locale: gregorian_en,
				});

				// Convert to selected calendar type for display
				if (calenderTp === CalendarType.HIJRI) {
					return dateObj.convert(arabic, locale === 'ar' ? arabic_ar : arabic_en);
				}
				return dateObj.convert(gregorian, locale === 'ar' ? gregorian_ar : gregorian_en);
			}
		} catch (error) {
			console.error('Error parsing date value:', error);
			return null;
		}
	}, [value, calenderTp, locale, dbFormatMode]);

	// Update calendar when switching between Hijri/Gregorian
	useEffect(() => {
		// Force re-render when calendar type changes
	}, [calenderTp]);

	// Get display text for input field
	const displayText = useMemo(() => {
		if (!dateObjectValue) return '';

		if (Array.isArray(dateObjectValue)) {
			if (range) {
				// Range mode: show "start ~ end"
				return dateObjectValue.map((d) => d.format(screenFormat)).join(' ~ ');
			} else {
				// Multiple mode: show "date1, date2, date3"
				return dateObjectValue.map((d) => d.format(screenFormat)).join(', ');
			}
		} else {
			// Single mode
			return dateObjectValue.format(screenFormat);
		}
	}, [dateObjectValue, screenFormat, range]);

	// Calendar configuration based on locale and calendar type
	const calendarConfig = useMemo(() => {
		const config = {
			calendar: gregorian,
			locale: gregorian_en,
			weekStartDayIndex: 0,
			weekendDays: [5, 6], // Friday & Saturday for Gregorian
		};

		if (calenderTp === CalendarType.HIJRI) {
			config.calendar = arabic;
			config.locale = locale === 'ar' ? arabic_ar : arabic_en;
			config.weekStartDayIndex = 1; // Start with Monday
			config.weekendDays = [6, 0]; // Saturday & Sunday for Hijri
		} else {
			config.calendar = gregorian;
			config.locale = locale === 'ar' ? gregorian_ar : gregorian_en;
			config.weekStartDayIndex = 0; // Start with Sunday
			config.weekendDays = [5, 6]; // Friday & Saturday
		}

		if (locale === 'ar') {
			config.locale.meridiems = meridiems_ar;

			if (calenderTp === CalendarType.HIJRI) {
				config.locale.months = monthsHijri_ar;
			}
		}
		return config;
	}, [locale, calenderTp]);

	function handleOnChange(selectedDates: DateObject | DateObject[] | null) {
		if (!selectedDates) {
			onChange?.(null);
			return;
		}

		// Convert selected dates to gregorian format for DB storage
		let gregorianDate: string | string[] | null = null;

		if (Array.isArray(selectedDates)) {
			// Range or Multiple mode
			gregorianDate = selectedDates.map((dateObj) => dateObj.convert(gregorian, gregorian_en).format(dbFormatMode));
		} else {
			// Single mode
			gregorianDate = selectedDates.convert(gregorian, gregorian_en).format(dbFormatMode);
		}

		onChange?.(gregorianDate);
	}

	function handleToday() {
		// Get today in gregorian
		const today = new DateObject({
			calendar: gregorian,
			locale: gregorian_en,
		});

		if (range || multiple) {
			handleOnChange([today]);
		} else {
			handleOnChange(today);
		}
	}

	function handleClear() {
		onChange?.(null);
	}

	function handleCalendarTypeChange(checked: boolean) {
		setCalenderTp(checked ? CalendarType.HIJRI : CalendarType.GREGORIAN);
	}

	return (
		<div>
			<Popover>
				<PopoverTrigger asChild>
					<Input
						type='text'
						name={name}
						value={displayText}
						readOnly={true}
						disabled={disabled}
						placeholder={t(placeholder)}
						className={cn('cursor-pointer', inputClass)}
					/>
				</PopoverTrigger>
				<PopoverContent className='min-w-fit p-0 bg-muted'>
					<div className='relative shadcn-datepicker'>
						{/* Calendar Type Switcher */}
						<div className='flex justify-center items-center gap-2 p-2 pt-4 border-b'>
							<Label className='cursor-pointer' onClick={() => setCalenderTp(CalendarType.HIJRI)}>
								{t('common.sections.hijri')}
							</Label>
							<Switch
								id='calendar-switch'
								checked={calenderTp === CalendarType.HIJRI}
								onCheckedChange={handleCalendarTypeChange}
							/>
							<Label className='cursor-pointer' onClick={() => setCalenderTp(CalendarType.GREGORIAN)}>
								{t('common.sections.gregorian')}
							</Label>
						</div>

						{/* Calendar Component */}
						<Calendar
							showOtherDays
							shadow={false}
							value={dateObjectValue}
							onChange={handleOnChange}
							format={screenFormat}
							weekStartDayIndex={calendarConfig.weekStartDayIndex}
							locale={calendarConfig.locale}
							calendar={calendarConfig.calendar}
							range={range}
							multiple={multiple}
							disabled={disabled}
							minDate={minDate && new DateObject(minDate)}
							maxDate={maxDate && new DateObject(maxDate)}
							mapDays={({ date }) => {
								if (disabledDates && disabledDates?.length > 0) {
									const dates = disabledDates.map((d) =>
										new DateObject(d).convert(calendarConfig.calendar, calendarConfig.locale).format(displayFormat)
									);

									// const formatted = date.convert(gregorian, gregorian_en).format('YYYY-MM-DD');
									if (dates.includes(date.format(displayFormat))) {
										return {
											disabled: true, // Disable the day
											style: {
												opacity: 0.4,
												textDecoration: 'line-through',
											},
										};
									}
								}

								if (onlyAllowedDates && onlyAllowedDates?.length > 0) {
									const dates = onlyAllowedDates.map((d) =>
										new DateObject(d).convert(calendarConfig.calendar, calendarConfig.locale).format(displayFormat)
									);

									if (!dates.includes(date.format(displayFormat))) {
										return {
											disabled: true, // Disable the day
											style: {
												opacity: 0.4,
												textDecoration: 'line-through',
											},
										};
									}
								}
								return {};
							}}
							plugins={[
								...(timePicker
									? [<TimePicker key='time-picker' hideSeconds format='hh:mm A' position='bottom' />]
									: []),
								highlightWeekends(calendarConfig.weekendDays),
							].filter(Boolean)}
						>
							{/* Action Buttons */}
							<div className='flex gap-3 items-center justify-center p-2 pt-0 rtl:flex-row-reverse'>
								<Button type='button' variant='default' size='sm' onClick={handleToday}>
									{t('common.actions.today') || 'Today'}
								</Button>
								<Button type='button' variant='outline' size='sm' onClick={handleClear}>
									{t('common.actions.clear') || 'Clear'}
								</Button>
							</div>
						</Calendar>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	);
}
