import { useState, useEffect } from 'react';
import '../styles/AdminPanel.css';

export default function AdminPanel() {
  const [form, setForm] = useState({
    businessName: '',
    businessAddress: '',
    hashtags: '',
    captions: [''],
    photoLimit: 15,
    interval: 5,
    pageTitle: '',
    logo: '',
    background: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('adminSettings');
    if (saved) setForm(JSON.parse(saved));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCaptionChange = (index, value) => {
    const updatedCaptions = [...form.captions];
    updatedCaptions[index] = value;
    setForm({ ...form, captions: updatedCaptions });
  };

  const addCaptionField = () => {
    if (form.captions.length < 5) {
      setForm({ ...form, captions: [...form.captions, ''] });
    }
  };

  const removeCaptionField = (index) => {
    const updated = [...form.captions];
    updated.splice(index, 1);
    setForm({ ...form, captions: updated });
  };

  const handleFileChange = (e, key) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm({ ...form, [key]: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('adminSettings', JSON.stringify(form));
    alert('Settings saved successfully!');
  };

  return (
    <div className="admin-container">
      <form className="form-box" onSubmit={handleSave}>
        <h2 className="form-title">Admin Panel</h2>

        <label>Business Name</label>
        <input type="text" name="businessName" value={form.businessName} onChange={handleChange} />

        <label>Business Address</label>
        <input type="text" name="businessAddress" value={form.businessAddress} onChange={handleChange} />

        <label>Hashtags (comma-separated)</label>
        <input type="text" name="hashtags" value={form.hashtags} onChange={handleChange} />

        <label>Caption Templates</label>
        <div className="caption-list">
          {form.captions.map((caption, index) => (
            <div key={index} className="caption-field">
              <input
                type="text"
                placeholder={`Caption ${index + 1}`}
                value={caption}
                onChange={(e) => handleCaptionChange(index, e.target.value)}
              />
              {form.captions.length > 1 && (
                <button
                  type="button"
                  className="remove-caption"
                  onClick={() => removeCaptionField(index)}
                >
                  ❌
                </button>
              )}
            </div>
          ))}
          {form.captions.length < 5 && (
            <button type="button" className="add-caption-btn" onClick={addCaptionField}>
              + Add Caption
            </button>
          )}
        </div>

        <label>Number of photos to retain (15–99)</label>
        <input
          type="number"
          name="photoLimit"
          value={form.photoLimit}
          min="15"
          max="99"
          onChange={handleChange}
        />

        <label>Posting Interval (minutes)</label>
        <input
          type="number"
          name="interval"
          value={form.interval}
          min="1"
          onChange={handleChange}
        />

        <label>Page Title</label>
        <input type="text" name="pageTitle" value={form.pageTitle} onChange={handleChange} />

        <label>Upload Logo</label>
        <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} />

        <label>Upload Background Image</label>
        <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'background')} />

        <button type="submit" className="save-btn">💾 Save Settings</button>
      </form>
    </div>
  );
}
