using System;

namespace SecureAttend.API.Models
{
    public class SchoolConfig
    {
        public int Id { get; set; }
        public double SchoolLatitude { get; set; }
        public double SchoolLongitude { get; set; }
        public double RadiusToleransiMetre { get; set; }
        public TimeSpan JamMasukMulai { get; set; }
        public TimeSpan JamMasukBatas { get; set; }
    }
}
