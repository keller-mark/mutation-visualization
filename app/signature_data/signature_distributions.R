# SignatureEstimation library source:
# https://www.ncbi.nlm.nih.gov/CBBresearch/Przytycka/index.cgi#signatureestimation
library(SignatureEstimation)

# Compute signature contribution for each sample using decomposeQP
sample.names <- colnames(tumorBRCA)
signature.distributions <- data.frame(matrix(ncol = 30, nrow = 0))
for (i in 1:ncol(tumorBRCA)) {
  signature.distributions[sample.names[i],] <- decomposeQP(tumorBRCA[,i], signaturesCOSMIC)
}

# Example of boxplot for single signature:
# boxplot(signature.distributions[,2], data=signature.distributions, main="Distribution of Signature", xlab=paste("Sig ", as.character(sig.i)), ylab="Distribution of Signature Contribution")

# Example of boxplot matrix (Figure 3A):
# boxplot.matrix(as.matrix(signature.distributions))

write.csv(t(signature.distributions), file = paste(getwd(), "/../visualization/data/signature_distributions_t.csv", sep = ""))