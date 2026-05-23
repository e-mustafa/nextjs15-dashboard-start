'use client';
import { TLocalesData } from '@/configs/general';
import useLocale from '@/hooks/useLocale';
import { cn } from '@/lib/utils';
import '@/styles/multi-date-picker.css';
import { useMemo, useState } from 'react';

import arabic from 'react-date-object/calendars/arabic';
import gregorian from 'react-date-object/calendars/gregorian';
import arabic_ar from 'react-date-object/locales/arabic_ar';
import arabic_en from 'react-date-object/locales/arabic_en';
import gregorian_ar from 'react-date-object/locales/gregorian_ar';
import gregorian_en from 'react-date-object/locales/gregorian_en';

import { Calendar, DateObject } from 'react-multi-date-picker';
import highlightWeekends from 'react-multi-date-picker/plugins/highlight_weekends';
import TimePicker from 'react-multi-date-picker/plugins/time_picker';

import { Button } from '@/components/ui-custom/custom-button';
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
	value?: string | string[] | null;
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
	const activeLanguage = language || locale || 'en';

	const [calenderTp, setCalenderTp] = useState(calendarType);
	const dbFormatMode = timePicker ? dbFormatWTime : dbFormat;
	const screenFormat = timePicker ? displayFormatWTime : displayFormat;

	// 1. Calendar configuration
	const calendarConfig = useMemo(() => {
		const config = {
			calendar: gregorian,
			locale: gregorian_en,
			weekStartDayIndex: 0,
			weekendDays: [5, 6],
		};

		if (calenderTp === CalendarType.HIJRI) {
			config.calendar = arabic;
			config.locale = activeLanguage === 'ar' ? arabic_ar : arabic_en;
			config.weekStartDayIndex = 1;
			config.weekendDays = [6, 0];
		} else {
			config.calendar = gregorian;
			config.locale = activeLanguage === 'ar' ? gregorian_ar : gregorian_en;
			config.weekStartDayIndex = 0;
			config.weekendDays = [5, 6];
		}

		if (activeLanguage === 'ar') {
			config.locale.meridiems = meridiems_ar;
			if (calenderTp === CalendarType.HIJRI) {
				config.locale.months = monthsHijri_ar;
			}
		}
		return config;
	}, [activeLanguage, calenderTp]);

	// 2. Convert DB value to DateObject
	const dateObjectValue = useMemo(() => {
		if (!value) return null;

		try {
			const toDateObject = (dateStr: string) => {
				const dateObj = new DateObject({
					date: dateStr,
					format: dbFormatMode,
					calendar: gregorian,
					locale: gregorian_en,
				});
				return dateObj.convert(calendarConfig.calendar, calendarConfig.locale);
			};

			if (Array.isArray(value)) {
				return value.map(toDateObject);
			}
			return toDateObject(value);
		} catch (error) {
			console.error('Error parsing date value:', error);
			return null;
		}
	}, [value, dbFormatMode, calendarConfig]);

	// 3. Get display text
	const displayText = useMemo(() => {
		if (!dateObjectValue) return '';
		if (Array.isArray(dateObjectValue)) {
			return dateObjectValue.map((d) => d.format(screenFormat)).join(range ? ' ~ ' : ', ');
		}
		return dateObjectValue.format(screenFormat);
	}, [dateObjectValue, screenFormat, range]);

	// 🔥 4. PERFORMANCE BOOST: Pre-calculate blocked/allowed dates ONCE
	const formattedDisabledDates = useMemo(() => {
		if (!disabledDates?.length) return [];
		return disabledDates.map((d) =>
			new DateObject(d).convert(calendarConfig.calendar, calendarConfig.locale).format(displayFormat),
		);
	}, [disabledDates, calendarConfig]);

	const formattedAllowedDates = useMemo(() => {
		if (!onlyAllowedDates?.length) return [];
		return onlyAllowedDates.map((d) =>
			new DateObject(d).convert(calendarConfig.calendar, calendarConfig.locale).format(displayFormat),
		);
	}, [onlyAllowedDates, calendarConfig]);

	// 5. Memoize Plugins
	const calendarPlugins = useMemo(() => {
		return [
			...(timePicker ? [<TimePicker key='time-picker' hideSeconds format='hh:mm A' position='bottom' />] : []),
			highlightWeekends(calendarConfig.weekendDays),
		].filter(Boolean);
	}, [timePicker, calendarConfig.weekendDays]);

	// 6. Handlers
	function handleOnChange(selectedDates: DateObject | DateObject[] | null) {
		if (!selectedDates) {
			onChange?.(null);
			return;
		}

		let gregorianDate: string | string[] | null = null;

		if (Array.isArray(selectedDates)) {
			gregorianDate = selectedDates.map((dateObj) => {
				const nativeDate = new Date(dateObj.valueOf());
				if (timePicker) return nativeDate.toISOString();
				return new DateObject(dateObj).convert(gregorian, gregorian_en).format(dbFormat);
			});
		} else {
			const nativeDate = new Date(selectedDates.valueOf());
			if (timePicker) {
				gregorianDate = nativeDate.toISOString();
			} else {
				gregorianDate = new DateObject(selectedDates).convert(gregorian, gregorian_en).format(dbFormat);
			}
		}

		onChange?.(gregorianDate);
	}

	function handleToday() {
		// use the current calendar configuration to prevent flashing
		const today = new DateObject({
			calendar: calendarConfig.calendar,
			locale: calendarConfig.locale,
		});

		handleOnChange(range || multiple ? [today] : today);
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
							plugins={calendarPlugins}
							mapDays={({ date }) => {
								// map each day to check if it is disabled
								const currentDateStr = date.format(displayFormat);
								let isDayDisabled = false;

								if (formattedDisabledDates.length > 0 && formattedDisabledDates.includes(currentDateStr)) {
									isDayDisabled = true;
								}

								if (formattedAllowedDates.length > 0 && !formattedAllowedDates.includes(currentDateStr)) {
									isDayDisabled = true;
								}

								if (isDayDisabled) {
									return {
										disabled: true,
										style: { opacity: 0.4, textDecoration: 'line-through' },
									};
								}
								return {};
							}}
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
