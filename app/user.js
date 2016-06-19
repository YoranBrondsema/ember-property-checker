import Ember from 'ember';
import DS from 'ember-data';
import ModelValidations from 'frontend/validations/models/user';
import BackendErrorHandler from 'frontend/mixins/backend-error-handler';
import moment from 'npm:moment';

const POSSIBLE_TITLES = [ 'Mr.', 'Ms.', 'Mrs.', 'Dr.' ];
const NUMBER_OF_FREE_STUDENT_TIMELINES_LEFT_BEFORE_WARNING = 25;

/* Inheritance for Teacher and Students is much nicer but it's still a PITA in Ember Data. */
const User = DS.Model.extend(BackendErrorHandler, ModelValidations, {
  /* Associations */
  timelines: DS.hasMany('timeline'),
  schoolClasses: DS.hasMany('school-class'),
  profileImageFile: DS.belongsTo('image-file'),
  // Teacher-specific
  completedTours: DS.hasMany('tour-completion'),
  emailSubscriptions: DS.hasMany('email-subscription'),
  // Publisher specific
  organization: DS.belongsTo('organization'),
  /* Attributes */
  firstName: DS.attr('string'),
  lastName: DS.attr('string'),
  password: DS.attr('string'),
  type: DS.attr('string'),
  authToken: DS.attr('string'),
  signInCount: DS.attr('number'),
  isConfirmed: DS.attr('boolean'),
  completedRegistration: DS.attr('boolean'),
  registrationMechanism: DS.attr('string'),
  createdAt: DS.attr('date'),
  intercomUserHash: DS.attr('string'),
  // Premium information
  hasPremiumPrivileges: DS.attr('boolean'),
  premiumSubscriptionExpiresAt: DS.attr('date'),
  premiumSubscriptionLastChargedAt: DS.attr('date'),
  // Teacher-specific
  email: DS.attr('string'),
  title: DS.attr('string'),
  professionalRole: DS.attr('string'),
  schoolName: DS.attr('string'),
  location: DS.attr('string'),
  country: DS.attr('string'),
  state: DS.attr('string'),
  city: DS.attr('string'),
  numberOfFreeStudentTimelinesLeft: DS.attr('number'),
  numberOfStudents: DS.attr('number'),
  // Student-specific
  username: DS.attr('string'),

  /* Validations */
  backendErrorMessages: {
    update: { generic: "An error occurred while saving the personal profile." }
  },

  /* Properties */
  hasProfileImage: Ember.computed.notEmpty('profileImageFile.imageFileVersions'),
  initials: function() {
    const firstInitial = this.get('firstName').charAt(0);
    const lastInitial = this.get('lastName').split(' ').get('lastObject').charAt(0);
    return `${firstInitial}${lastInitial}`.toUpperCase();
  }.property('firstName', 'lastName'),
  fullName: function() {
    const firstName = (this.get('firstName') || '').trim();
    const lastName = (this.get('lastName') || '').trim();
    return `${firstName} ${lastName}`;
  }.property('firstName', 'lastName'),
  formalName: function() {
    return `${this.get('title')} ${this.get('lastName')}`;
  }.property('title', 'lastName'),
  isEditor: Ember.computed.equal('type', 'editor'),
  isPublisher: Ember.computed.equal('type', 'publisher'),
  isTeacher: Ember.computed.equal('type', 'teacher'),
  isStudent: Ember.computed.equal('type', 'student'),
  hasFreeStudentTimelinesLeft: Ember.computed.gte('numberOfFreeStudentTimelinesLeft', 1),
  hasProfessionalRole: Ember.computed.notEmpty('professionalRole'),
  schoolClassesBreadCrumbName: function() {
    return this.get('isStudent') ? 'Learn' : 'Teach';
  }.property('isStudent'),
  // Returns `createdAt` as the number of seconds since January 1st, 1970
  createdAtAsUnixTimestamp: function() {
    if (Ember.isNone(this.get('createdAt'))) {
      return undefined;
    } else {
      return moment(this.get('createdAt')).unix();
    }
  }.property('createdAt'),
  showHstryLogoOnMyEmbeddedTimelines: Ember.computed.not('hasPremiumPrivileges'),
  canPrint: Ember.computed.reads('hasPremiumPrivileges'),
  canNotPrint: Ember.computed.not('canPrint'),
  /* Teacher-specific */
  isPremium: Ember.computed.and('isTeacher', 'hasPremiumPrivileges'),
  canBecomePremium: Ember.computed.reads('isTeacher'),
  isInPremiumWarningZone: Ember.computed.lte('numberOfFreeStudentTimelinesLeft', NUMBER_OF_FREE_STUDENT_TIMELINES_LEFT_BEFORE_WARNING),
  // Returns all the students of the teacher
  students: function() {
    if (this.get('isTeacher')) {
      const students = [];
      this.get('schoolClasses').forEach((schoolClass) => {
        students.pushObjects(schoolClass.get('students'));
      });
      return students;
    } else {
      return [];
    }
  }.property('isTeacher', 'schoolClasses.@each.students'),
  /* Student-specific */
  teachers: function() {
    return this.get('schoolClasses').mapBy('teacher').compact();
  }.property('schoolClasses.@each.teacher'),

  // Permissions
  canEditProfile: Ember.computed.or('isPublisher', 'isTeacher')
});

User.reopenClass({
  POSSIBLE_TITLES: POSSIBLE_TITLES,
  PREMIUM_PLAN: '2-annual',
  PREMIUM_PRICE: '49',
  NUMBER_OF_FREE_STUDENT_TIMELINES: 200
});

export default User;
