import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { MapPin, Clock, Users, ArrowRight, ArrowLeft, Check, Edit2, Mountain, Compass, Activity, TrendingUp, DollarSign } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { activityTypesAPI, eventsAPI } from '../lib/api'
import toast from 'react-hot-toast'
import GooglePlacesAutocomplete from '../components/GooglePlacesAutocomplete'

const STEPS = {
  BASICS: 0,
  LOCATION: 1,
  DETAILS: 2,
  REVIEW: 3
}

const STEP_TITLES = {
  [STEPS.BASICS]: 'Start with the basics',
  [STEPS.LOCATION]: 'Where will you hike?',
  [STEPS.DETAILS]: 'Add hike details',
  [STEPS.REVIEW]: 'Review your event'
}

const DIFFICULTY_OPTIONS = [
  { value: 'BEGINNER', label: 'Beginner', description: 'Easy trails, minimal elevation', icon: '🟢' },
  { value: 'INTERMEDIATE', label: 'Intermediate', description: 'Moderate trails, some elevation', icon: '🟡' },
  { value: 'ADVANCED', label: 'Advanced', description: 'Challenging trails, steep sections', icon: '🟠' },
  { value: 'EXPERT', label: 'Expert', description: 'Very challenging, technical terrain', icon: '🔴' }
]

const HIKING_REQUIREMENTS = [
  'Hiking boots',
  'Water (2L minimum)',
  'Weatherproof jacket',
  'First aid kit',
  'Map and compass',
  'Headlamp/torch',
  'Emergency shelter',
  'Food and snacks',
  'Sun protection',
  'Warm layers'
]
