Template.lessonsUpload.onCreated(function () {

  Uploader.init(this);
  if (this.data)
    this.autoStart = this.data.autoStart;
});


Template.lessonsUpload.onRendered(function () {

  Uploader.render.call(this);
});


Template.lessonsUpload.helpers({

  'infoLabel': function() {
    var instance = Template.instance();

    var info = instance.info.get()
    if (!info) {
      return;
    }

    var progress = instance.globalInfo.get();

    if (progress.progress != 100) { // Hide buttons if progress is not 100%
        $('.lessons-post-submit--button-submit').prop('disabled', true);
        $('.lessons-post-edit--submit').prop('disabled', true);
    }
 
    return progress.running ?
      info.name + ' - ' + progress.progress + '% - [' + progress.bitrate + ']' :
      info.name + ' - ' + info.size + 'B';
  },
  'progress': function() {
    return Template.instance().globalInfo.get().progress + '%';
  },
  'submitData': function() {
        if (this.formData) {
            this.formData['contentType'] = this.contentType;
        } else {
            this.formData = {contentType: this.contentType};
        }
        return typeof this.formData == 'string' ? this.formData : JSON.stringify(this.formData);
    }
})